import type { VkFavoriteSnapshot } from './models/favorite';

export function createVkFavoriteSnapshot(externalId: string, now: Date): VkFavoriteSnapshot {
  return {
    profile: {
      vkUserId: externalId,
      firstName: 'VK',
      lastName: `User ${externalId}`,
      screenName: `id${externalId}`,
      photoUrl: '',
    },
    snapshotUpdatedAt: now,
  };
}
