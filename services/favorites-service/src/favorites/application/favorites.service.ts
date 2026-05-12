import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { create } from '@bufbuild/protobuf';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';

import {
  CreateFavoriteRequest,
  CreateFavoriteResponse,
  CreateFavoriteResponseSchema,
  DeleteFavoriteRequest,
  DeleteFavoriteResponse,
  DeleteFavoriteResponseSchema,
  FavoriteSchema,
  GetFavoriteRequest,
  GetFavoriteResponse,
  GetFavoriteResponseSchema,
  ListFavoritesRequest,
  ListFavoritesResponse,
  ListFavoritesResponseSchema,
  RefreshFavoriteRequest,
  RefreshFavoriteResponse,
  RefreshFavoriteResponseSchema,
  UpdateFavoriteRequest,
  UpdateFavoriteResponse,
  UpdateFavoriteResponseSchema,
} from '@findnmeet/ts-types/favorites/v1';
import { PageResponseSchema, Provider } from '@findnmeet/ts-types/shared/v1';
import type { Uuid } from '@findnmeet/ts-types/shared/v1';

import { favoriteExists } from '../domain/errors/favorite-exists';
import { favoriteNotFound } from '../domain/errors/favorite-not-found';
import { unsupportedUpdateMask } from '../domain/errors/unsupported-update-mask';
import { createFavorite } from '../domain/favorite.factory';
import { createUuid } from '../domain/identifiers/create-uuid';
import { requireExternalId } from '../domain/identifiers/require-external-id';
import { requireUuid } from '../domain/identifiers/require-uuid';
import { requireSupportedProvider } from '../domain/providers/require-supported-provider';
import { parsePageOffset } from './pagination/parse-page-offset';
import { FAVORITES_REPOSITORY } from './ports/favorites.repository';
import type { FavoritesRepository } from './ports/favorites.repository';
import type { FavoriteRecord } from './ports/favorite-record.type';
import { resolvePageSize } from './pagination/resolve-page-size';

@Injectable()
export class FavoritesApplicationService {
  constructor(@Inject(FAVORITES_REPOSITORY) private readonly favoritesRepository: FavoritesRepository) {}

  async createFavorite(ownerId: string, request: CreateFavoriteRequest): Promise<CreateFavoriteResponse> {
    const provider = requireSupportedProvider(request.provider);
    const externalId = requireExternalId(request.externalId, 'external_id');
    const existingId = await this.favoritesRepository.findDuplicateFavoriteId(ownerId, provider, externalId);

    if (existingId) {
      throw favoriteExists();
    }

    const now = new Date();
    const favorite = createFavorite({
      id: createUuid(randomUUID()),
      provider,
      externalId,
      note: request.note,
      now,
    });

    await this.favoritesRepository.save(favorite, ownerId);

    return create(CreateFavoriteResponseSchema, { favorite });
  }

  async getFavorite(ownerId: string, request: GetFavoriteRequest): Promise<GetFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(ownerId, request.favoriteId);
    return create(GetFavoriteResponseSchema, { favorite });
  }

  async listFavorites(ownerId: string, request: ListFavoritesRequest): Promise<ListFavoritesResponse> {
    const provider = request.provider === Provider.UNSPECIFIED ? undefined : request.provider;
    const pageSize = resolvePageSize(request.page?.pageSize);
    const offset = parsePageOffset(request.page?.pageToken);
    const filtered = await this.favoritesRepository.listByOwner(ownerId, provider);
    const pageItems = filtered.slice(offset, offset + pageSize);
    const nextOffset = offset + pageItems.length;
    const nextPageToken = nextOffset < filtered.length ? String(nextOffset) : '';

    return create(ListFavoritesResponseSchema, {
      favorites: pageItems,
      page: create(PageResponseSchema, { nextPageToken }),
    });
  }

  async updateFavorite(ownerId: string, request: UpdateFavoriteRequest): Promise<UpdateFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(ownerId, request.favoriteId);
    const maskPaths = request.updateMask?.paths ?? [];

    if (maskPaths.length > 0 && !maskPaths.includes('note')) {
      throw unsupportedUpdateMask();
    }

    const nextFavorite = create(FavoriteSchema, {
      ...favorite,
      note: request.patch?.note ?? favorite.note,
      updatedAt: timestampFromDate(new Date()),
    });

    await this.favoritesRepository.save(nextFavorite, ownerId);

    return create(UpdateFavoriteResponseSchema, { favorite: nextFavorite });
  }

  async deleteFavorite(ownerId: string, request: DeleteFavoriteRequest): Promise<DeleteFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(ownerId, request.favoriteId);
    await this.favoritesRepository.delete(favorite);

    return create(DeleteFavoriteResponseSchema, {});
  }

  async refreshFavorite(ownerId: string, request: RefreshFavoriteRequest): Promise<RefreshFavoriteResponse> {
    const favorite = await this.requireOwnedFavorite(ownerId, request.favoriteId);
    const now = new Date();
    const refreshed = createFavorite({
      id: favorite.id!,
      provider: favorite.provider,
      externalId: favorite.externalId,
      note: favorite.note,
      now,
      addedAt: favorite.addedAt,
    });

    await this.favoritesRepository.save(refreshed, ownerId);

    return create(RefreshFavoriteResponseSchema, { favorite: refreshed });
  }

  private async requireOwnedFavorite(ownerId: string, favoriteIdValue: Uuid | undefined): Promise<FavoriteRecord> {
    const favoriteId = requireUuid(favoriteIdValue, 'favorite_id');
    const favorite = await this.favoritesRepository.findById(favoriteId.value);

    if (!favorite || favorite.ownerId !== ownerId) {
      throw favoriteNotFound();
    }

    return favorite;
  }
}
