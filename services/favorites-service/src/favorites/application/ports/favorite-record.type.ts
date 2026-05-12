import type { Favorite } from '../../domain/models/favorite';

export type FavoriteRecord = Favorite & {
  ownerId: string;
  sortKey: number;
};
