import { Injectable } from '@nestjs/common';

import { favoriteNotFound } from '../../../domain/errors/favorite-not-found';
import type { Favorite } from '../../../domain/models/favorite';
import { FavoritesRepository } from '../../../domain/ports/favorites.repository';
import { requireUuid } from '../../../domain/requirements';
import type { DeleteFavoriteCommand } from '../../contracts/favorites.commands';

@Injectable()
export class DeleteFavoriteUseCase {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  async execute(ownerId: string, command: DeleteFavoriteCommand): Promise<void> {
    const favorite = await this.requireOwnedFavorite(ownerId, command.favoriteId);
    await this.favoritesRepository.delete(favorite);
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
