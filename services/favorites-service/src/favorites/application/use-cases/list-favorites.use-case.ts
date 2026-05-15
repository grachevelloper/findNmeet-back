import { Injectable } from '@nestjs/common';

import { FavoritesRepository } from '../../domain/ports/favorites.repository';
import type { ListFavoritesQuery } from '../contracts/favorites.commands';
import type { ListFavoritesResult } from '../contracts/favorites.results';
import { parsePageOffset } from '../pagination/parse-page-offset';
import { resolvePageSize } from '../pagination/resolve-page-size';

@Injectable()
export class ListFavoritesUseCase {
  constructor(private readonly favoritesRepository: FavoritesRepository) {}

  async execute(ownerId: string, query: ListFavoritesQuery): Promise<ListFavoritesResult> {
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
}
