import { Injectable } from '@nestjs/common';

import { favoriteNotFound } from '../../../domain/errors/favorite-not-found';
import { unsupportedUpdateMask } from '../../../domain/errors/unsupported-update-mask';
import type { Favorite } from '../../../domain/models/favorite';
import { FavoritesRepository } from '../../../domain/ports/favorites.repository';
import { requireUuid } from '../../../domain/requirements';
import type { UpdateFavoriteCommand } from '../../contracts/favorites.commands';

@Injectable()
export class UpdateFavoriteUseCase {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  async execute(ownerId: string, command: UpdateFavoriteCommand): Promise<Favorite> {
    const favorite = await this.requireOwnedFavorite(ownerId, command.favoriteId);
    const maskPaths = command.updateMaskPaths;

    if (maskPaths.length > 0 && !maskPaths.includes('note')) {
      throw unsupportedUpdateMask();
    }

    const nextFavorite: Favorite = {
      ...favorite,
      note: command.note ?? favorite.note,
      updatedAt: new Date(),
    };

    await this.favoritesRepository.save(nextFavorite);

    return nextFavorite;
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
