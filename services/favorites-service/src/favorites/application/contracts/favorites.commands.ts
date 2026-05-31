import type { FavoriteProvider } from '../../domain/models/favorite-provider';
import type { VkProfileSnapshot } from '../../domain/models/favorite';

export interface CreateFavoriteCommand {
  provider?: FavoriteProvider;
  externalId: string;
  note: string;
  vkProfile?: VkProfileSnapshot;
}

export interface GetFavoriteQuery {
  favoriteId: string | undefined;
}

export interface ListFavoritesQuery {
  provider?: FavoriteProvider;
  pageSize?: number;
  pageToken?: string;
}

export interface UpdateFavoriteCommand {
  favoriteId: string | undefined;
  note: string | undefined;
  updateMaskPaths: string[];
}

export type DeleteFavoriteCommand = GetFavoriteQuery;

export type RefreshFavoriteCommand = GetFavoriteQuery;
