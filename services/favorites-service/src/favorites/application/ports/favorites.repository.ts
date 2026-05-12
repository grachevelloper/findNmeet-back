import type { Favorite } from '../../domain/models/favorite';
import type { FavoriteProvider } from '../../domain/models/favorite-provider';

import type { FavoriteRecord } from './favorite-record.type';

export const FAVORITES_REPOSITORY = Symbol('FAVORITES_REPOSITORY');

export interface FavoritesRepository {
  findById(favoriteId: string): Promise<FavoriteRecord | undefined>;
  findDuplicateFavoriteId(ownerId: string, provider: FavoriteProvider, externalId: string): Promise<string | undefined>;
  listByOwner(ownerId: string, provider?: FavoriteProvider): Promise<FavoriteRecord[]>;
  save(favorite: Favorite, ownerId: string): Promise<void>;
  delete(favorite: Favorite): Promise<void>;
}
