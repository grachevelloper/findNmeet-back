import type { VkFavoriteSnapshot, VkProfileSnapshot } from './models/favorite';

export function createVkFavoriteSnapshot(
  externalId: string,
  now: Date,
  profile?: VkProfileSnapshot,
): VkFavoriteSnapshot {
  return {
    profile: profile ?? {
      vkUserId: externalId,
      firstName: 'VK',
      lastName: `User ${externalId}`,
      screenName: `id${externalId}`,
      photoUrl: '',
    },
    snapshotUpdatedAt: now,
  };
}
