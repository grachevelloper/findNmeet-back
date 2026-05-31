import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';

import { favoriteExists } from '../../../domain/errors/favorite-exists';
import { invalidExternalId } from '../../../domain/errors/validation-errors';
import type { Favorite } from '../../../domain/models/favorite';
import { createFavorite } from '../../../domain/favorite.factory';
import { createUuid } from '../../../domain/identifiers/create-uuid';
import { FavoritesRepository } from '../../../domain/ports/favorites.repository';
import { requireExternalId, requireSupportedProvider } from '../../../domain/requirements';
import type { CreateFavoriteCommand } from '../../contracts/favorites.commands';

@Injectable()
export class CreateFavoriteUseCase {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  async execute(ownerId: string, command: CreateFavoriteCommand): Promise<Favorite> {
    const provider = requireSupportedProvider(command.provider);
    const externalId = requireExternalId(command.externalId, 'external_id');
    if (command.vkProfile?.vkUserId && command.vkProfile.vkUserId !== externalId) {
      throw invalidExternalId('vk_profile.vk_user_id');
    }

    const existingId = await this.favoritesRepository.findDuplicateFavoriteId(ownerId, provider, externalId);

    if (existingId) {
      throw favoriteExists();
    }

    const now = new Date();
    const favorite = createFavorite({
      id: createUuid(randomUUID()),
      ownerId,
      provider,
      externalId,
      note: command.note,
      now,
      vkProfile: command.vkProfile,
    });

    await this.favoritesRepository.save(favorite);

    return favorite;
  }
}
