import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { entityToFavorite } from './entity-to-favorite-record';
import { FavoriteEntity } from './favorite.entity';
import { favoriteToEntity } from './favorite-to-entity';
import { providerToCode } from './provider-code.mapper';
import type { Favorite } from '../../domain/models/favorite';
import type { FavoriteProvider } from '../../domain/models/favorite-provider';
import { FavoritesRepository } from '../../domain/ports/favorites.repository';

@Injectable()
export class TypeOrmFavoritesRepository extends FavoritesRepository {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly repository: Repository<FavoriteEntity>,
  ) {
    super();
  }

  async findById(favoriteId: string): Promise<Favorite | undefined> {
    const entity = await this.repository.findOneBy({ id: favoriteId });
    return entity ? entityToFavorite(entity) : undefined;
  }

  async findDuplicateFavoriteId(
    userId: string,
    provider: FavoriteProvider,
    externalId: string,
  ): Promise<string | undefined> {
    const entity = await this.repository.findOne({
      select: { id: true },
      where: {
        userId,
        provider: providerToCode(provider),
        externalId,
      },
    });

    return entity?.id;
  }

  async listByOwner(userId: string, provider?: FavoriteProvider): Promise<Favorite[]> {
    const entities = await this.repository.find({
      where: {
        userId,
        ...(provider === undefined ? {} : { provider: providerToCode(provider) }),
      },
      order: {
        addedAt: 'DESC',
      },
    });

    return entities.map(entityToFavorite);
  }

  async save(favorite: Favorite): Promise<void> {
    await this.repository.save(favoriteToEntity(favorite));
  }

  async delete(favorite: Favorite): Promise<void> {
    await this.repository.delete({ id: favorite.id });
  }
}
