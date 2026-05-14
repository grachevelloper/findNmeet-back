import type { Favorite, VkFavoriteSnapshot } from '../../domain/models/favorite';
import { FavoriteEntity } from './favorite.entity';
import { providerToCode } from './provider-code.mapper';

export function favoriteToEntity(favorite: Favorite): FavoriteEntity {
  const entity = new FavoriteEntity();
  const vkSnapshot = favorite.providerDetails.kind === 'vkSnapshot' ? favorite.providerDetails.snapshot : undefined;

  entity.id = favorite.id;
  entity.userId = favorite.ownerId;
  entity.provider = providerToCode(favorite.provider);
  entity.externalId = favorite.externalId;
  entity.displayTitle = favorite.displayTitle;
  entity.displayImageUrl = favorite.displayImageUrl;
  entity.note = favorite.note;
  entity.addedAt = favorite.addedAt;
  entity.updatedAt = favorite.updatedAt;
  entity.vkSnapshot = vkSnapshot ? snapshotToJson(vkSnapshot) : null;

  return entity;
}

function snapshotToJson(snapshot: VkFavoriteSnapshot): Record<string, unknown> {
  return {
    profile: snapshot.profile,
    snapshotUpdatedAt: snapshot.snapshotUpdatedAt.toISOString(),
  };
}
