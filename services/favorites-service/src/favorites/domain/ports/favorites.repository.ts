import type { Favorite } from '../models/favorite';
import type { FavoriteProvider } from '../models/favorite-provider';

export abstract class FavoritesRepository {
  abstract findById(favoriteId: string): Promise<Favorite | undefined>;
  abstract findDuplicateFavoriteId(ownerId: string, provider: FavoriteProvider, externalId: string): Promise<string | undefined>;
  abstract listByOwner(ownerId: string, provider?: FavoriteProvider): Promise<Favorite[]>;
  abstract save(favorite: Favorite): Promise<void>;
  abstract delete(favorite: Favorite): Promise<void>;
}
