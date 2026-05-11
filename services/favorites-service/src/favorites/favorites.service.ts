import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { create } from '@bufbuild/protobuf';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import { getDefaultPageSize, getMaxPageSize } from '@findnmeet/utils';

import {
  CreateFavoriteRequest,
  CreateFavoriteResponse,
  CreateFavoriteResponseSchema,
  DeleteFavoriteRequest,
  DeleteFavoriteResponse,
  DeleteFavoriteResponseSchema,
  FavoriteSchema,
  GetFavoriteRequest,
  GetFavoriteResponse,
  GetFavoriteResponseSchema,
  ListFavoritesRequest,
  ListFavoritesResponse,
  ListFavoritesResponseSchema,
  RefreshFavoriteRequest,
  RefreshFavoriteResponse,
  RefreshFavoriteResponseSchema,
  UpdateFavoriteRequest,
  UpdateFavoriteResponse,
  UpdateFavoriteResponseSchema,
  VkFavoriteSnapshotSchema,
} from '@findnmeet/ts-types/favorites/v1';
import type { Favorite } from '@findnmeet/ts-types/favorites/v1';
import { PageResponseSchema, Provider, UuidSchema } from '@findnmeet/ts-types/shared/v1';
import type { Uuid } from '@findnmeet/ts-types/shared/v1';
import {
  VkOnlineStatus,
  VkPrivateMessageStatus,
  VkProfileSchema,
  VkProfileVisibility,
  VkRelationStatus,
} from '@findnmeet/ts-types/vk/v1';
import {
  favoriteExists,
  favoriteNotFound,
  invalidExternalId,
  invalidPageToken,
  missingRequiredField,
  unsupportedProvider,
  unsupportedUpdateMask,
} from './favorites.exceptions';
import { FavoritesRepository } from './favorites.repository';

@Injectable()
export class FavoritesService {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  async createFavorite(request: CreateFavoriteRequest): Promise<CreateFavoriteResponse> {
    const userId = requireUuid(request.userId, 'user_id');
    const provider = requireProvider(request.provider);
    const externalId = requireExternalId(request.externalId, 'external_id');
    const existingId = await this.favoritesRepository.findDuplicateFavoriteId(userId.value, provider, externalId);

    if (existingId) {
      throw favoriteExists();
    }

    const now = new Date();
    const favorite = this.buildFavorite({
      id: createUuid(randomUUID()),
      userId,
      provider,
      externalId,
      note: request.note,
      now,
    });

    await this.favoritesRepository.save(favorite);

    return create(CreateFavoriteResponseSchema, { favorite });
  }

  async getFavorite(request: GetFavoriteRequest): Promise<GetFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(request.userId, request.favoriteId);
    return create(GetFavoriteResponseSchema, { favorite });
  }

  async listFavorites(request: ListFavoritesRequest): Promise<ListFavoritesResponse> {
    const userId = requireUuid(request.userId, 'user_id');
    const provider = request.provider === Provider.UNSPECIFIED ? undefined : request.provider;
    const pageSize = clampPageSize(request.page?.pageSize);
    const offset = parsePageToken(request.page?.pageToken);
    const filtered = await this.favoritesRepository.listByOwner(userId.value, provider);
    const pageItems = filtered.slice(offset, offset + pageSize);
    const nextOffset = offset + pageItems.length;
    const nextPageToken = nextOffset < filtered.length ? String(nextOffset) : '';

    return create(ListFavoritesResponseSchema, {
      favorites: pageItems,
      page: create(PageResponseSchema, { nextPageToken }),
    });
  }

  async updateFavorite(request: UpdateFavoriteRequest): Promise<UpdateFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(request.userId, request.favoriteId);
    const maskPaths = request.updateMask?.paths ?? [];

    if (maskPaths.length > 0 && !maskPaths.includes('note')) {
      throw unsupportedUpdateMask();
    }

    const nextFavorite = create(FavoriteSchema, {
      ...favorite,
      note: request.patch?.note ?? favorite.note,
      updatedAt: timestampFromDate(new Date()),
    });

    await this.favoritesRepository.save(nextFavorite);

    return create(UpdateFavoriteResponseSchema, { favorite: nextFavorite });
  }

  async deleteFavorite(request: DeleteFavoriteRequest): Promise<DeleteFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(request.userId, request.favoriteId);
    await this.favoritesRepository.delete(favorite);

    return create(DeleteFavoriteResponseSchema, {});
  }

  async refreshFavorite(request: RefreshFavoriteRequest): Promise<RefreshFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(request.userId, request.favoriteId);
    const now = new Date();
    const refreshed = this.buildFavorite({
      id: favorite.id!,
      userId: favorite.userId!,
      provider: favorite.provider,
      externalId: favorite.externalId,
      note: favorite.note,
      now,
      addedAt: favorite.addedAt,
    });

    await this.favoritesRepository.save(refreshed);

    return create(RefreshFavoriteResponseSchema, { favorite: refreshed });
  }

  private async requireOwnedFavorite(userIdValue: Uuid | undefined, favoriteIdValue: Uuid | undefined): Promise<Favorite> {
    const userId = requireUuid(userIdValue, 'user_id');
    const favoriteId = requireUuid(favoriteIdValue, 'favorite_id');
    const favorite = await this.favoritesRepository.findById(favoriteId.value);

    if (!favorite || favorite.userId?.value !== userId.value) {
      throw favoriteNotFound();
    }

    return favorite;
  }

  private buildFavorite(input: {
    id: Uuid;
    userId: Uuid;
    provider: Provider;
    externalId: string;
    note: string;
    now: Date;
    addedAt?: Favorite['addedAt'];
  }): Favorite {
    if (input.provider !== Provider.VK) {
      throw unsupportedProvider();
    }

    const snapshot = this.buildVkSnapshot(input.externalId, input.now);
    const profile = snapshot.profile!;
    const displayTitle = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

    return create(FavoriteSchema, {
      id: input.id,
      userId: input.userId,
      provider: input.provider,
      externalId: input.externalId,
      displayTitle,
      displayImageUrl: profile.photoUrl,
      note: input.note,
      addedAt: input.addedAt ?? timestampFromDate(input.now),
      updatedAt: timestampFromDate(input.now),
      providerDetails: {
        case: 'vkSnapshot',
        value: snapshot,
      },
    });
  }

  private buildVkSnapshot(externalId: string, now: Date) {
    return create(VkFavoriteSnapshotSchema, {
      profile: create(VkProfileSchema, {
        vkUserId: BigInt(externalId),
        firstName: 'VK',
        lastName: `User ${externalId}`,
        screenName: `id${externalId}`,
        photoUrl: '',
        onlineStatus: VkOnlineStatus.UNKNOWN,
        relation: VkRelationStatus.UNKNOWN,
        visibility: VkProfileVisibility.UNKNOWN,
        privateMessageStatus: VkPrivateMessageStatus.UNKNOWN,
      }),
      snapshotUpdatedAt: timestampFromDate(now),
    });
  }
}

export function createUuid(value: string): Uuid {
  return create(UuidSchema, { value });
}

function requireUuid(value: Uuid | undefined, fieldName: string): Uuid {
  if (!value?.value) {
    throw missingRequiredField(fieldName);
  }

  return value;
}

function requireProvider(provider: Provider): Provider {
  if (provider === Provider.UNSPECIFIED) {
    throw missingRequiredField('provider');
  }

  return provider;
}

function requireExternalId(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw missingRequiredField(fieldName);
  }

  if (!/^\d+$/.test(trimmed)) {
    throw invalidExternalId(fieldName);
  }

  return trimmed;
}

function clampPageSize(pageSize: number | undefined): number {
  if (!pageSize || pageSize < 1) {
    return getDefaultPageSize();
  }

  return Math.min(pageSize, getMaxPageSize());
}

function parsePageToken(pageToken: string | undefined): number {
  if (!pageToken) {
    return 0;
  }

  const offset = Number(pageToken);

  if (!Number.isInteger(offset) || offset < 0) {
    throw invalidPageToken();
  }

  return offset;
}
