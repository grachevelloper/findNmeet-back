import { Injectable } from '@nestjs/common';
import { fromJson, toJson, create } from '@bufbuild/protobuf';
import type { JsonValue } from '@bufbuild/protobuf';
import { timestampDate, timestampFromDate } from '@bufbuild/protobuf/wkt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteSchema, VkFavoriteSnapshotSchema } from '@findnmeet/ts-types/favorites/v1';
import type { Favorite, VkFavoriteSnapshot } from '@findnmeet/ts-types/favorites/v1';
import { Provider } from '@findnmeet/ts-types/shared/v1';
import { UuidSchema } from '@findnmeet/ts-types/shared/v1';

import { FavoriteEntity } from './favorite.entity';

export type FavoriteRecord = Favorite & {
  sortKey: number;
};

@Injectable()
export class FavoritesRepository {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly repository: Repository<FavoriteEntity>,
  ) {}

  async findById(favoriteId: string): Promise<FavoriteRecord | undefined> {
    const entity = await this.repository.findOneBy({ id: favoriteId });
    return entity ? this.toFavoriteRecord(entity) : undefined;
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

    return entities.map((entity) => this.toFavoriteRecord(entity));
  }

  async save(favorite: Favorite): Promise<void> {
    await this.repository.save(this.toEntity(favorite));
  }

  async delete(favorite: Favorite): Promise<void> {
    await this.repository.delete({ id: favorite.id!.value });
  }

  private toEntity(favorite: Favorite): FavoriteEntity {
    const entity = new FavoriteEntity();
    const vkSnapshot = favorite.providerDetails.case === 'vkSnapshot' ? favorite.providerDetails.value : undefined;

    entity.id = favorite.id!.value;
    entity.userId = favorite.userId!.value;
    entity.provider = favorite.provider;
    entity.externalId = favorite.externalId;
    entity.displayTitle = favorite.displayTitle;
    entity.displayImageUrl = favorite.displayImageUrl;
    entity.note = favorite.note;
    entity.addedAt = timestampDate(favorite.addedAt!);
    entity.updatedAt = timestampDate(favorite.updatedAt!);
    entity.vkSnapshot = vkSnapshot ? (toJson(VkFavoriteSnapshotSchema, vkSnapshot) as Record<string, unknown>) : null;

    return entity;
  }

  private toFavoriteRecord(entity: FavoriteEntity): FavoriteRecord {
    const vkSnapshot = entity.vkSnapshot
      ? (fromJson(VkFavoriteSnapshotSchema, entity.vkSnapshot as JsonValue) as VkFavoriteSnapshot)
      : undefined;

    return {
      ...create(FavoriteSchema, {
        id: create(UuidSchema, { value: entity.id }),
        userId: create(UuidSchema, { value: entity.userId }),
        provider: entity.provider,
        externalId: entity.externalId,
        displayTitle: entity.displayTitle,
        displayImageUrl: entity.displayImageUrl,
        note: entity.note,
        addedAt: timestampFromDate(entity.addedAt),
        updatedAt: timestampFromDate(entity.updatedAt),
        providerDetails: vkSnapshot
          ? {
              case: 'vkSnapshot',
              value: vkSnapshot,
            }
          : undefined,
      }),
      sortKey: entity.addedAt.getTime(),
    };
  }

}
