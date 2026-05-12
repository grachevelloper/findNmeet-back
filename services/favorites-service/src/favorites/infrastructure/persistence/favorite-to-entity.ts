import { toJson } from '@bufbuild/protobuf';
import { timestampDate } from '@bufbuild/protobuf/wkt';
import { VkFavoriteSnapshotSchema } from '@findnmeet/ts-types/favorites/v1';
import type { Favorite } from '@findnmeet/ts-types/favorites/v1';

import { FavoriteEntity } from './favorite.entity';

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
