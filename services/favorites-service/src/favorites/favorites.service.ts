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
import type { FavoriteRecord } from './favorites.repository';

@Injectable()
export class FavoritesApplicationService {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  async createFavorite(ownerId: string, request: CreateFavoriteRequest): Promise<CreateFavoriteResponse> {
    const provider = requireSupportedProvider(request.provider);
    const externalId = requireExternalId(request.externalId, 'external_id');
    const existingId = await this.favoritesRepository.findDuplicateFavoriteId(ownerId, provider, externalId);

    if (existingId) {
      throw favoriteExists();
    }

    const now = new Date();
    const favorite = this.buildFavorite({
      id: createUuid(randomUUID()),
      provider,
      externalId,
      note: request.note,
      now,
    });

    await this.favoritesRepository.save(favorite, ownerId);

    return create(CreateFavoriteResponseSchema, { favorite });
  }

  async getFavorite(ownerId: string, request: GetFavoriteRequest): Promise<GetFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(ownerId, request.favoriteId);
    return create(GetFavoriteResponseSchema, { favorite });
  }

  async listFavorites(ownerId: string, request: ListFavoritesRequest): Promise<ListFavoritesResponse> {
    const provider = request.provider === Provider.UNSPECIFIED ? undefined : request.provider;
    const pageSize = resolvePageSize(request.page?.pageSize);
    const offset = parsePageOffset(request.page?.pageToken);
    const filtered = await this.favoritesRepository.listByOwner(ownerId, provider);
    const pageItems = filtered.slice(offset, offset + pageSize);
    const nextOffset = offset + pageItems.length;
    const nextPageToken = nextOffset < filtered.length ? String(nextOffset) : '';

    return create(ListFavoritesResponseSchema, {
      favorites: pageItems,
      page: create(PageResponseSchema, { nextPageToken }),
    });
  }

  async updateFavorite(ownerId: string, request: UpdateFavoriteRequest): Promise<UpdateFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(ownerId, request.favoriteId);
    const maskPaths = request.updateMask?.paths ?? [];

    if (maskPaths.length > 0 && !maskPaths.includes('note')) {
      throw unsupportedUpdateMask();
    }

    const nextFavorite = create(FavoriteSchema, {
      ...favorite,
      note: request.patch?.note ?? favorite.note,
      updatedAt: timestampFromDate(new Date()),
    });

    await this.favoritesRepository.save(nextFavorite, ownerId);

    return create(UpdateFavoriteResponseSchema, { favorite: nextFavorite });
  }

  async deleteFavorite(ownerId: string, request: DeleteFavoriteRequest): Promise<DeleteFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(ownerId, request.favoriteId);
    await this.favoritesRepository.delete(favorite);

    return create(DeleteFavoriteResponseSchema, {});
  }

  async refreshFavorite(ownerId: string, request: RefreshFavoriteRequest): Promise<RefreshFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(ownerId, request.favoriteId);
    const now = new Date();
    const refreshed = this.buildFavorite({
      id: favorite.id!,
      provider: favorite.provider,
      externalId: favorite.externalId,
      note: favorite.note,
      now,
      addedAt: favorite.addedAt,
    });

    await this.favoritesRepository.save(refreshed, ownerId);

    return create(RefreshFavoriteResponseSchema, { favorite: refreshed });
  }

  private async requireOwnedFavorite(ownerId: string, favoriteIdValue: Uuid | undefined): Promise<FavoriteRecord> {
    const favoriteId = requireUuid(favoriteIdValue, 'favorite_id');
    const favorite = await this.favoritesRepository.findById(favoriteId.value);

    if (!favorite || favorite.ownerId !== ownerId) {
      throw favoriteNotFound();
    }

    return favorite;
  }

  private buildFavorite(input: {
    id: Uuid;
    provider: Provider;
    externalId: string;
    note: string;
    now: Date;
    addedAt?: Favorite['addedAt'];
  }): Favorite {
    const snapshot = this.buildVkSnapshot(input.externalId, input.now);
    const profile = snapshot.profile!;
    const displayTitle = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

    return create(FavoriteSchema, {
      id: input.id,
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

function createUuid(value: string): Uuid {
  return create(UuidSchema, { value });
}

function requireUuid(value: Uuid | undefined, fieldName: string): Uuid {
  if (!value?.value) {
    throw missingRequiredField(fieldName);
  }

  return value;
}

function requireSupportedProvider(provider: Provider): Provider {
  if (provider === Provider.UNSPECIFIED) {
    throw missingRequiredField('provider');
  }

  if (provider !== Provider.VK) {
    throw unsupportedProvider();
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

function resolvePageSize(pageSize: number | undefined): number {
  if (!pageSize || pageSize < 1) {
    return getDefaultPageSize();
  }

  return Math.min(pageSize, getMaxPageSize());
}

function parsePageOffset(pageToken: string | undefined): number {
  if (!pageToken) {
    return 0;
  }

  const offset = Number(pageToken);

  if (!Number.isInteger(offset) || offset < 0) {
    throw invalidPageToken();
  }

  return offset;
}
