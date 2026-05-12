import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Favorite } from '@findnmeet/ts-types/favorites/v1';
import { Provider } from '@findnmeet/ts-types/shared/v1';

import { entityToFavoriteRecord } from './entity-to-favorite-record';
import { FavoriteEntity } from './favorite.entity';
import { favoriteToEntity } from './favorite-to-entity';
import type { FavoriteRecord } from '../../application/ports/favorite-record.type';
import type { FavoritesRepository } from '../../application/ports/favorites.repository';

@Injectable()
export class TypeOrmFavoritesRepository implements FavoritesRepository {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly repository: Repository<FavoriteEntity>,
  ) {}

  async findById(favoriteId: string): Promise<FavoriteRecord | undefined> {
    const entity = await this.repository.findOneBy({ id: favoriteId });
    return entity ? entityToFavoriteRecord(entity) : undefined;
  }

  async findDuplicateFavoriteId(userId: string, provider: Provider, externalId: string): Promise<string | undefined> {
    const entity = await this.repository.findOne({
      select: { id: true },
      where: {
        userId,
        provider,
        externalId,
      },
    });

    return entity?.id;
  }

  async listByOwner(userId: string, provider?: Provider): Promise<FavoriteRecord[]> {
    const entities = await this.repository.find({
      where: {
        userId,
        ...(provider === undefined ? {} : { provider }),
      },
      order: {
        addedAt: 'DESC',
      },
    });

    return entities.map(entityToFavoriteRecord);
  }

  async save(favorite: Favorite, ownerId: string): Promise<void> {
    await this.repository.save(favoriteToEntity(favorite, ownerId));
  }

  async delete(favorite: Favorite): Promise<void> {
    await this.repository.delete({ id: favorite.id!.value });
  }
}
