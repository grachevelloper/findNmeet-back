import { create, fromJson } from '@bufbuild/protobuf';
import type { JsonValue } from '@bufbuild/protobuf';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import { FavoriteSchema, VkFavoriteSnapshotSchema } from '@findnmeet/ts-types/favorites/v1';
import type { VkFavoriteSnapshot } from '@findnmeet/ts-types/favorites/v1';
import { UuidSchema } from '@findnmeet/ts-types/shared/v1';

import type { FavoriteRecord } from '../../application/ports/favorite-record.type';
import { FavoriteEntity } from './favorite.entity';

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
