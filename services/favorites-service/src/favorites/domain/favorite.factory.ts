import type { Favorite } from './models/favorite';
import type { FavoriteProvider } from './models/favorite-provider';
import { createVkFavoriteSnapshot } from './vk-favorite-snapshot.factory';

export function createFavorite(input: {
  id: string;
  ownerId: string;
  provider: FavoriteProvider;
  externalId: string;
  note: string;
  now: Date;
  addedAt?: Date;
}): Favorite {
  const snapshot = createVkFavoriteSnapshot(input.externalId, input.now);
  const profile = snapshot.profile;
  const displayTitle = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

  return {
    id: input.id,
    ownerId: input.ownerId,
    provider: input.provider,
    externalId: input.externalId,
    displayTitle,
    displayImageUrl: profile.photoUrl,
    note: input.note,
    addedAt: input.addedAt ?? input.now,
    updatedAt: input.now,
    providerDetails: {
      kind: 'vkSnapshot',
      snapshot,
    },
  };
}
