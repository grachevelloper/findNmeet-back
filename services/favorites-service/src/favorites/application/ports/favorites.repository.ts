import type { Favorite } from '@findnmeet/ts-types/favorites/v1';
import type { Provider } from '@findnmeet/ts-types/shared/v1';

import type { FavoriteRecord } from './favorite-record.type';

export const FAVORITES_REPOSITORY = Symbol('FAVORITES_REPOSITORY');

export interface FavoritesRepository {
  findById(favoriteId: string): Promise<FavoriteRecord | undefined>;
  findDuplicateFavoriteId(ownerId: string, provider: Provider, externalId: string): Promise<string | undefined>;
  listByOwner(ownerId: string, provider?: Provider): Promise<FavoriteRecord[]>;
  save(favorite: Favorite, ownerId: string): Promise<void>;
  delete(favorite: Favorite): Promise<void>;
}
