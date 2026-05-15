import type { Favorite, VkFavoriteSnapshot } from '../../domain/models/favorite';
import { FavoriteEntity } from './favorite.entity';
import { providerFromCode } from './provider-code.mapper';

export function entityToFavorite(entity: FavoriteEntity): Favorite {
  const vkSnapshot = entity.vkSnapshot ? restoreVkSnapshot(entity.vkSnapshot) : undefined;

  return {
    id: entity.id,
    ownerId: entity.userId,
    provider: providerFromCode(entity.provider),
    externalId: entity.externalId,
    displayTitle: entity.displayTitle,
    displayImageUrl: entity.displayImageUrl,
    note: entity.note,
    addedAt: entity.addedAt,
    updatedAt: entity.updatedAt,
    providerDetails: {
      kind: 'vkSnapshot',
      snapshot: vkSnapshot ?? {
        profile: {
          vkUserId: entity.externalId,
          firstName: '',
          lastName: '',
          screenName: '',
          photoUrl: '',
        },
        snapshotUpdatedAt: entity.updatedAt,
      },
    },
  };
}

function restoreVkSnapshot(value: Record<string, unknown>): VkFavoriteSnapshot {
  const profile = value.profile as Record<string, unknown> | undefined;

  return {
    profile: {
      vkUserId: String(profile?.vkUserId ?? ''),
      firstName: String(profile?.firstName ?? ''),
      lastName: String(profile?.lastName ?? ''),
      screenName: String(profile?.screenName ?? ''),
      photoUrl: String(profile?.photoUrl ?? ''),
    },
    snapshotUpdatedAt: new Date(String(value.snapshotUpdatedAt)),
  };
}
