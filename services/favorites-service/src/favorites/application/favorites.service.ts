import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';

import { favoriteExists } from '../domain/errors/favorite-exists';
import { favoriteNotFound } from '../domain/errors/favorite-not-found';
import { unsupportedUpdateMask } from '../domain/errors/unsupported-update-mask';
import type { Favorite } from '../domain/models/favorite';
import { createFavorite } from '../domain/favorite.factory';
import { createUuid } from '../domain/identifiers/create-uuid';
import { requireExternalId, requireSupportedProvider, requireUuid } from '../domain/requirements';
import type {
  CreateFavoriteCommand,
  DeleteFavoriteCommand,
  GetFavoriteQuery,
  ListFavoritesQuery,
  RefreshFavoriteCommand,
  UpdateFavoriteCommand,
} from './contracts/favorites.commands';
import type { ListFavoritesResult } from './contracts/favorites.results';
import { parsePageOffset } from './pagination/parse-page-offset';
import { FAVORITES_REPOSITORY } from './ports/favorites.repository';
import type { FavoritesRepository } from './ports/favorites.repository';
import type { FavoriteRecord } from './ports/favorite-record.type';
import { resolvePageSize } from './pagination/resolve-page-size';

@Injectable()
export class FavoritesApplicationService {
  constructor(@Inject(FAVORITES_REPOSITORY) private readonly favoritesRepository: FavoritesRepository) {}

  async createFavorite(ownerId: string, command: CreateFavoriteCommand): Promise<Favorite> {
    const provider = requireSupportedProvider(command.provider);
    const externalId = requireExternalId(command.externalId, 'external_id');
    const existingId = await this.favoritesRepository.findDuplicateFavoriteId(ownerId, provider, externalId);

    if (existingId) {
      throw favoriteExists();
    }

    const now = new Date();
    const favorite = createFavorite({
      id: createUuid(randomUUID()),
      provider,
      externalId,
      note: command.note,
      now,
    });

    await this.favoritesRepository.save(favorite, ownerId);

    return favorite;
  }

  async getFavorite(ownerId: string, query: GetFavoriteQuery): Promise<Favorite> {
    return this.requireOwnedFavorite(ownerId, query.favoriteId);
  }

  async listFavorites(ownerId: string, query: ListFavoritesQuery): Promise<ListFavoritesResult> {
    const provider = query.provider;
    const pageSize = resolvePageSize(query.pageSize);
    const offset = parsePageOffset(query.pageToken);
    const filtered = await this.favoritesRepository.listByOwner(ownerId, provider);
    const pageItems = filtered.slice(offset, offset + pageSize);
    const nextOffset = offset + pageItems.length;
    const nextPageToken = nextOffset < filtered.length ? String(nextOffset) : '';

    return {
      favorites: pageItems,
      nextPageToken,
    };
  }

  async updateFavorite(ownerId: string, command: UpdateFavoriteCommand): Promise<Favorite> {
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

    await this.favoritesRepository.save(nextFavorite, ownerId);

    return nextFavorite;
  }

  async deleteFavorite(ownerId: string, command: DeleteFavoriteCommand): Promise<void> {
    const favorite = await this.requireOwnedFavorite(ownerId, command.favoriteId);
    await this.favoritesRepository.delete(favorite);
  }

  async refreshFavorite(ownerId: string, command: RefreshFavoriteCommand): Promise<Favorite> {
    const favorite = await this.requireOwnedFavorite(ownerId, command.favoriteId);
    const now = new Date();
    const refreshed = createFavorite({
      id: favorite.id,
      provider: favorite.provider,
      externalId: favorite.externalId,
      note: favorite.note,
      now,
      addedAt: favorite.addedAt,
    });

    await this.favoritesRepository.save(refreshed, ownerId);

    return refreshed;
  }

  private async requireOwnedFavorite(ownerId: string, favoriteIdValue: string | undefined): Promise<FavoriteRecord> {
    const favoriteId = requireUuid(favoriteIdValue, 'favorite_id');
    const favorite = await this.favoritesRepository.findById(favoriteId);

    if (!favorite || favorite.ownerId !== ownerId) {
      throw favoriteNotFound();
    }

    return favorite;
  }
}
