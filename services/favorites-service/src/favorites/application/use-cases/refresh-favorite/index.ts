import { Injectable } from '@nestjs/common';

import { favoriteNotFound } from '../../../domain/errors/favorite-not-found';
import type { Favorite } from '../../../domain/models/favorite';
import { createFavorite } from '../../../domain/favorite.factory';
import { FavoritesRepository } from '../../../domain/ports/favorites.repository';
import { requireUuid } from '../../../domain/requirements';
import type { RefreshFavoriteCommand } from '../../contracts/favorites.commands';

@Injectable()
export class RefreshFavoriteUseCase {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  async execute(ownerId: string, command: RefreshFavoriteCommand): Promise<Favorite> {
    const favorite = await this.requireOwnedFavorite(ownerId, command.favoriteId);
    const now = new Date();
    const refreshed = createFavorite({
      id: favorite.id,
      ownerId: favorite.ownerId,
      provider: favorite.provider,
      externalId: favorite.externalId,
      note: favorite.note,
      now,
      addedAt: favorite.addedAt,
    });

    await this.favoritesRepository.save(refreshed);

    return refreshed;
  }

  private async requireOwnedFavorite(ownerId: string, favoriteIdValue: string | undefined): Promise<Favorite> {
    const favoriteId = requireUuid(favoriteIdValue, 'favorite_id');
    const favorite = await this.favoritesRepository.findById(favoriteId);

    if (!favorite || favorite.ownerId !== ownerId) {
      throw favoriteNotFound();
    }

    return favorite;
  }
}
