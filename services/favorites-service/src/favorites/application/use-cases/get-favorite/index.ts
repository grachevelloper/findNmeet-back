import { Injectable } from '@nestjs/common';

import { favoriteNotFound } from '../../../domain/errors/favorite-not-found';
import type { Favorite } from '../../../domain/models/favorite';
import { FavoritesRepository } from '../../../domain/ports/favorites.repository';
import { requireUuid } from '../../../domain/requirements';
import type { GetFavoriteQuery } from '../../contracts/favorites.commands';

@Injectable()
export class GetFavoriteUseCase {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  async execute(ownerId: string, query: GetFavoriteQuery): Promise<Favorite> {
    const favoriteId = requireUuid(query.favoriteId, 'favorite_id');
    const favorite = await this.favoritesRepository.findById(favoriteId);

    if (!favorite || favorite.ownerId !== ownerId) {
      throw favoriteNotFound();
    }

    return favorite;
  }
}
