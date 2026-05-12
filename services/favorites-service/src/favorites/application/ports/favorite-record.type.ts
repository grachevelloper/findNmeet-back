import type { Favorite } from '@findnmeet/ts-types/favorites/v1';

export type FavoriteRecord = Favorite & {
  ownerId: string;
  sortKey: number;
};
