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

  createFavorite(request: CreateFavoriteRequest): CreateFavoriteResponse {
    const userId = requireUuid(request.userId, 'user_id');
    const provider = requireProvider(request.provider);
    const externalId = requireExternalId(request.externalId, 'external_id');
    const existingId = this.favoritesRepository.findDuplicateFavoriteId(userId.value, provider, externalId);

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

    this.favoritesRepository.save(favorite, now.getTime());

    return create(CreateFavoriteResponseSchema, { favorite });
  }

  getFavorite(request: GetFavoriteRequest): GetFavoriteResponse {
    const favorite = this.requireOwnedFavorite(request.userId, request.favoriteId);
    return create(GetFavoriteResponseSchema, { favorite });
  }

  listFavorites(request: ListFavoritesRequest): ListFavoritesResponse {
    const userId = requireUuid(request.userId, 'user_id');
    const provider = request.provider === Provider.UNSPECIFIED ? undefined : request.provider;
    const pageSize = clampPageSize(request.page?.pageSize);
    const offset = parsePageToken(request.page?.pageToken);
    const filtered = this.favoritesRepository.listByOwner(userId.value, provider);
    const pageItems = filtered.slice(offset, offset + pageSize);
    const nextOffset = offset + pageItems.length;
    const nextPageToken = nextOffset < filtered.length ? String(nextOffset) : '';

    return create(ListFavoritesResponseSchema, {
      favorites: pageItems,
      page: create(PageResponseSchema, { nextPageToken }),
    });
  }

  updateFavorite(request: UpdateFavoriteRequest): UpdateFavoriteResponse {
    const favorite = this.requireOwnedFavorite(request.userId, request.favoriteId);
    const maskPaths = request.updateMask?.paths ?? [];

    if (maskPaths.length > 0 && !maskPaths.includes('note')) {
      throw unsupportedUpdateMask();
    }

    const nextFavorite = create(FavoriteSchema, {
      ...favorite,
      note: request.patch?.note ?? favorite.note,
      updatedAt: timestampFromDate(new Date()),
    });

    this.favoritesRepository.save(
      nextFavorite,
      this.favoritesRepository.findById(nextFavorite.id!.value)?.sortKey ?? Date.now(),
    );

    return create(UpdateFavoriteResponseSchema, { favorite: nextFavorite });
  }

  deleteFavorite(request: DeleteFavoriteRequest): DeleteFavoriteResponse {
    const favorite = this.requireOwnedFavorite(request.userId, request.favoriteId);
    this.favoritesRepository.delete(favorite);

    return create(DeleteFavoriteResponseSchema, {});
  }

  refreshFavorite(request: RefreshFavoriteRequest): RefreshFavoriteResponse {
    const favorite = this.requireOwnedFavorite(request.userId, request.favoriteId);
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

    this.favoritesRepository.save(
      refreshed,
      this.favoritesRepository.findById(refreshed.id!.value)?.sortKey ?? now.getTime(),
    );

    return create(RefreshFavoriteResponseSchema, { favorite: refreshed });
  }

  clear(): void {
    this.favoritesRepository.clear();
  }

  private requireOwnedFavorite(userIdValue: Uuid | undefined, favoriteIdValue: Uuid | undefined): Favorite {
    const userId = requireUuid(userIdValue, 'user_id');
    const favoriteId = requireUuid(favoriteIdValue, 'favorite_id');
    const favorite = this.favoritesRepository.findById(favoriteId.value);

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
