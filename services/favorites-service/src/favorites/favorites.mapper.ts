import { create, fromJson, toJson } from '@bufbuild/protobuf';
import type { JsonValue } from '@bufbuild/protobuf';
import { timestampDate, timestampFromDate } from '@bufbuild/protobuf/wkt';
import { FavoriteSchema, VkFavoriteSnapshotSchema } from '@findnmeet/ts-types/favorites/v1';
import type { Favorite, VkFavoriteSnapshot } from '@findnmeet/ts-types/favorites/v1';
import { UuidSchema } from '@findnmeet/ts-types/shared/v1';

import { FavoriteEntity } from './favorite.entity';

export type FavoriteRecord = Favorite & {
  ownerId: string;
  sortKey: number;
};

export function favoriteToEntity(favorite: Favorite, ownerId: string): FavoriteEntity {
  const entity = new FavoriteEntity();
  const vkSnapshot = favorite.providerDetails.case === 'vkSnapshot' ? favorite.providerDetails.value : undefined;

  entity.id = favorite.id!.value;
  entity.userId = ownerId;
  entity.provider = favorite.provider;
  entity.externalId = favorite.externalId;
  entity.displayTitle = favorite.displayTitle;
  entity.displayImageUrl = favorite.displayImageUrl;
  entity.note = favorite.note;
  entity.addedAt = timestampDate(favorite.addedAt!);
  entity.updatedAt = timestampDate(favorite.updatedAt!);
  entity.vkSnapshot = vkSnapshot ? (toJson(VkFavoriteSnapshotSchema, vkSnapshot) as Record<string, unknown>) : null;

  return entity;
}

export function entityToFavoriteRecord(entity: FavoriteEntity): FavoriteRecord {
  const vkSnapshot = entity.vkSnapshot
    ? (fromJson(VkFavoriteSnapshotSchema, entity.vkSnapshot as JsonValue) as VkFavoriteSnapshot)
    : undefined;

  return {
    ...create(FavoriteSchema, {
      id: create(UuidSchema, { value: entity.id }),
      provider: entity.provider,
      externalId: entity.externalId,
      displayTitle: entity.displayTitle,
      displayImageUrl: entity.displayImageUrl,
      note: entity.note,
      addedAt: timestampFromDate(entity.addedAt),
      updatedAt: timestampFromDate(entity.updatedAt),
      providerDetails: vkSnapshot
        ? {
            case: 'vkSnapshot',
            value: vkSnapshot,
          }
        : undefined,
    }),
    ownerId: entity.userId,
    sortKey: entity.addedAt.getTime(),
  };
}
