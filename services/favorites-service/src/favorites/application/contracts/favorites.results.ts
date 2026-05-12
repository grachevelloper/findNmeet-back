import type { Favorite } from '../../domain/models/favorite';

export interface ListFavoritesResult {
  favorites: Favorite[];
  nextPageToken: string;
}
