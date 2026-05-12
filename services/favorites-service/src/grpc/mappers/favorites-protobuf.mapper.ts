import { create } from '@bufbuild/protobuf';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import {
  CreateFavoriteResponseSchema,
  DeleteFavoriteResponseSchema,
  FavoriteSchema,
  GetFavoriteResponseSchema,
  ListFavoritesResponseSchema,
  RefreshFavoriteResponseSchema,
  UpdateFavoriteResponseSchema,
  VkFavoriteSnapshotSchema,
} from '@findnmeet/ts-types/favorites/v1';
import type {
  CreateFavoriteRequest,
  CreateFavoriteResponse,
  DeleteFavoriteRequest,
  DeleteFavoriteResponse,
  GetFavoriteRequest,
  GetFavoriteResponse,
  ListFavoritesRequest,
  ListFavoritesResponse,
  RefreshFavoriteRequest,
  RefreshFavoriteResponse,
  UpdateFavoriteRequest,
  UpdateFavoriteResponse,
} from '@findnmeet/ts-types/favorites/v1';
import { PageResponseSchema, Provider, UuidSchema } from '@findnmeet/ts-types/shared/v1';
import {
  VkOnlineStatus,
  VkPrivateMessageStatus,
  VkProfileSchema,
  VkProfileVisibility,
  VkRelationStatus,
} from '@findnmeet/ts-types/vk/v1';

import type {
  CreateFavoriteCommand,
  DeleteFavoriteCommand,
  GetFavoriteQuery,
  ListFavoritesQuery,
  RefreshFavoriteCommand,
  UpdateFavoriteCommand,
} from '../../favorites/application/contracts/favorites.commands';
import type { ListFavoritesResult } from '../../favorites/application/contracts/favorites.results';
import type { Favorite, VkFavoriteSnapshot } from '../../favorites/domain/models/favorite';
import { FavoriteProvider } from '../../favorites/domain/models/favorite-provider';

export function createFavoriteCommandFromProto(request: CreateFavoriteRequest): CreateFavoriteCommand {
  return {
    provider: favoriteProviderFromProto(request.provider),
    externalId: request.externalId,
    note: request.note,
  };
}

export function getFavoriteQueryFromProto(request: GetFavoriteRequest): GetFavoriteQuery {
  return { favoriteId: request.favoriteId?.value };
}

export function listFavoritesQueryFromProto(request: ListFavoritesRequest): ListFavoritesQuery {
  return {
    provider: favoriteProviderFromProto(request.provider),
    pageSize: request.page?.pageSize,
    pageToken: request.page?.pageToken,
  };
}

export function updateFavoriteCommandFromProto(request: UpdateFavoriteRequest): UpdateFavoriteCommand {
  return {
    favoriteId: request.favoriteId?.value,
    note: request.patch?.note,
    updateMaskPaths: request.updateMask?.paths ?? [],
  };
}

export function deleteFavoriteCommandFromProto(request: DeleteFavoriteRequest): DeleteFavoriteCommand {
  return { favoriteId: request.favoriteId?.value };
}

export function refreshFavoriteCommandFromProto(request: RefreshFavoriteRequest): RefreshFavoriteCommand {
  return { favoriteId: request.favoriteId?.value };
}

export function createFavoriteResponseToProto(favorite: Favorite): CreateFavoriteResponse {
  return create(CreateFavoriteResponseSchema, { favorite: favoriteToProto(favorite) });
}

export function getFavoriteResponseToProto(favorite: Favorite): GetFavoriteResponse {
  return create(GetFavoriteResponseSchema, { favorite: favoriteToProto(favorite) });
}

export function listFavoritesResponseToProto(result: ListFavoritesResult): ListFavoritesResponse {
  return create(ListFavoritesResponseSchema, {
    favorites: result.favorites.map(favoriteToProto),
    page: create(PageResponseSchema, { nextPageToken: result.nextPageToken }),
  });
}

export function updateFavoriteResponseToProto(favorite: Favorite): UpdateFavoriteResponse {
  return create(UpdateFavoriteResponseSchema, { favorite: favoriteToProto(favorite) });
}

export function deleteFavoriteResponseToProto(): DeleteFavoriteResponse {
  return create(DeleteFavoriteResponseSchema, {});
}

export function refreshFavoriteResponseToProto(favorite: Favorite): RefreshFavoriteResponse {
  return create(RefreshFavoriteResponseSchema, { favorite: favoriteToProto(favorite) });
}

function favoriteToProto(favorite: Favorite) {
  return create(FavoriteSchema, {
    id: create(UuidSchema, { value: favorite.id }),
    provider: favoriteProviderToProto(favorite.provider),
    externalId: favorite.externalId,
    displayTitle: favorite.displayTitle,
    displayImageUrl: favorite.displayImageUrl,
    note: favorite.note,
    addedAt: timestampFromDate(favorite.addedAt),
    updatedAt: timestampFromDate(favorite.updatedAt),
    providerDetails: {
      case: 'vkSnapshot',
      value: vkFavoriteSnapshotToProto(favorite.providerDetails.snapshot, favorite.externalId),
    },
  });
}

function vkFavoriteSnapshotToProto(snapshot: VkFavoriteSnapshot, fallbackExternalId: string) {
  return create(VkFavoriteSnapshotSchema, {
    profile: create(VkProfileSchema, {
      vkUserId: BigInt(snapshot.profile.vkUserId || fallbackExternalId),
      firstName: snapshot.profile.firstName,
      lastName: snapshot.profile.lastName,
      screenName: snapshot.profile.screenName,
      photoUrl: snapshot.profile.photoUrl,
      onlineStatus: VkOnlineStatus.UNKNOWN,
      relation: VkRelationStatus.UNKNOWN,
      visibility: VkProfileVisibility.UNKNOWN,
      privateMessageStatus: VkPrivateMessageStatus.UNKNOWN,
    }),
    snapshotUpdatedAt: timestampFromDate(snapshot.snapshotUpdatedAt),
  });
}

function favoriteProviderFromProto(provider: Provider): FavoriteProvider | undefined {
  if (provider === Provider.UNSPECIFIED) {
    return undefined;
  }

  if (provider === Provider.VK) {
    return FavoriteProvider.VK;
  }

  return undefined;
}

function favoriteProviderToProto(provider: FavoriteProvider): Provider {
  switch (provider) {
    case FavoriteProvider.VK:
      return Provider.VK;
  }
}
