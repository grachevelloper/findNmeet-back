import type { FavoriteProvider } from './favorite-provider';

export interface Favorite {
  id: string;
  ownerId: string;
  provider: FavoriteProvider;
  externalId: string;
  displayTitle: string;
  displayImageUrl: string;
  note: string;
  addedAt: Date;
  updatedAt: Date;
  providerDetails: FavoriteProviderDetails;
}

export type FavoriteProviderDetails = {
  kind: 'vkSnapshot';
  snapshot: VkFavoriteSnapshot;
};

export interface VkFavoriteSnapshot {
  profile: VkProfileSnapshot;
  snapshotUpdatedAt: Date;
}

export interface VkProfileSnapshot {
  vkUserId: string;
  firstName: string;
  lastName: string;
  screenName: string;
  photoUrl: string;
}
