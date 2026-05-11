import { Injectable } from '@nestjs/common';
import type { Favorite } from '@findnmeet/ts-types/favorites/v1';
import { Provider } from '@findnmeet/ts-types/shared/v1';

export type FavoriteRecord = Favorite & {
  sortKey: number;
};

@Injectable()
export class FavoritesRepository {
  private readonly favorites = new Map<string, FavoriteRecord>();
  private readonly favoriteIdsByOwnerAndExternalId = new Map<string, string>();

  findById(favoriteId: string): FavoriteRecord | undefined {
    return this.favorites.get(favoriteId);
  }

  findDuplicateFavoriteId(userId: string, provider: Provider, externalId: string): string | undefined {
    return this.favoriteIdsByOwnerAndExternalId.get(this.ownerExternalKey(userId, provider, externalId));
  }

  listByOwner(userId: string, provider?: Provider): FavoriteRecord[] {
    return [...this.favorites.values()]
      .filter((favorite) => favorite.userId?.value === userId)
      .filter((favorite) => provider === undefined || favorite.provider === provider)
      .sort((a, b) => b.sortKey - a.sortKey);
  }

  save(favorite: Favorite, sortKey: number): void {
    this.favorites.set(favorite.id!.value, { ...favorite, sortKey });
    this.favoriteIdsByOwnerAndExternalId.set(
      this.ownerExternalKey(favorite.userId!.value, favorite.provider, favorite.externalId),
      favorite.id!.value,
    );
  }

  delete(favorite: Favorite): void {
    this.favorites.delete(favorite.id!.value);
    this.favoriteIdsByOwnerAndExternalId.delete(
      this.ownerExternalKey(favorite.userId!.value, favorite.provider, favorite.externalId),
    );
  }

  clear(): void {
    this.favorites.clear();
    this.favoriteIdsByOwnerAndExternalId.clear();
  }

  private ownerExternalKey(userId: string, provider: Provider, externalId: string): string {
    return `${userId}:${provider}:${externalId}`;
  }
}
