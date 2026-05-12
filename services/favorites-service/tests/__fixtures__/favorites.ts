import { create } from '@bufbuild/protobuf';
import { Metadata } from '@grpc/grpc-js';
import { timestampDate } from '@bufbuild/protobuf/wkt';
import {
  CreateFavoriteRequestSchema,
  DeleteFavoriteRequestSchema,
  GetFavoriteRequestSchema,
  RefreshFavoriteRequestSchema,
} from '@findnmeet/ts-types/favorites/v1';
import type {
  CreateFavoriteRequest,
  DeleteFavoriteRequest,
  Favorite,
  GetFavoriteRequest,
  RefreshFavoriteRequest,
} from '@findnmeet/ts-types/favorites/v1';
import { Provider, UuidSchema } from '@findnmeet/ts-types/shared/v1';

import type { FavoriteRecord } from '../../src/favorites/application/ports/favorite-record.type';
import type { FavoritesRepository } from '../../src/favorites/application/ports/favorites.repository';

export const userId = '550e8400-e29b-41d4-a716-446655440000';

export function metadataWithUserId(currentUserId = userId): Metadata {
  const metadata = new Metadata();
  metadata.add('x-user-id', currentUserId);
  return metadata;
}

export function createFavoriteRequest(externalId: string, note?: string): CreateFavoriteRequest {
  return create(CreateFavoriteRequestSchema, {
    provider: Provider.VK,
    externalId,
    note,
  });
}

export function favoriteIdRequest<T extends GetFavoriteRequest | DeleteFavoriteRequest | RefreshFavoriteRequest>(
  schema:
    | typeof GetFavoriteRequestSchema
    | typeof DeleteFavoriteRequestSchema
    | typeof RefreshFavoriteRequestSchema,
  favoriteId: string,
): T {
  return create(schema, {
    favoriteId: create(UuidSchema, { value: favoriteId }),
  }) as T;
}

export function createRepositoryFake(): FavoritesRepository {
  const favorites = new Map<string, FavoriteRecord>();

  return {
    async findById(favoriteId: string) {
      return favorites.get(favoriteId);
    },
    async findDuplicateFavoriteId(ownerId: string, provider: Provider, externalId: string) {
      return [...favorites.values()].find(
        (favorite) =>
          favorite.ownerId === ownerId && favorite.provider === provider && favorite.externalId === externalId,
      )?.id?.value;
    },
    async listByOwner(ownerId: string, provider?: Provider) {
      return [...favorites.values()]
        .filter((favorite) => favorite.ownerId === ownerId)
        .filter((favorite) => provider === undefined || favorite.provider === provider)
        .sort((a, b) => b.sortKey - a.sortKey);
    },
    async save(favorite: Favorite, ownerId: string) {
      favorites.set(favorite.id!.value, {
        ...favorite,
        ownerId,
        sortKey: timestampDate(favorite.addedAt!).getTime(),
      });
    },
    async delete(favorite: Favorite) {
      favorites.delete(favorite.id!.value);
    },
  } as FavoritesRepository;
}
