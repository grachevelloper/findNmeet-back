import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Favorite } from '@findnmeet/ts-types/favorites/v1';
import { Provider } from '@findnmeet/ts-types/shared/v1';

import { FavoriteEntity } from './favorite.entity';
import { entityToFavoriteRecord, favoriteToEntity } from './favorites.mapper';
import type { FavoriteRecord } from './favorites.mapper';

export type { FavoriteRecord } from './favorites.mapper';

@Injectable()
export class FavoritesRepository {
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
