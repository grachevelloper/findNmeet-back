import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';

import {
  favoriteCreateResponseToJson,
  favoriteDeleteResponseToJson,
  favoriteGetResponseToJson,
  favoriteListResponseToJson,
  favoriteRefreshResponseToJson,
  favoriteUpdateResponseToJson,
  mapCreateFavoriteRequest,
  mapDeleteFavoriteRequest,
  mapGetFavoriteRequest,
  mapListFavoritesRequest,
  mapRefreshFavoriteRequest,
  mapUpdateFavoriteRequest,
} from './favorites.http-mapper';
import { FavoritesService } from './favorites.service';

@Controller('internal/favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  create(@Headers('x-user-id') userId: string | undefined, @Body() body: Record<string, unknown>) {
    const response = this.favoritesService.createFavorite(mapCreateFavoriteRequest(userId, body));
    return favoriteCreateResponseToJson(response);
  }

  @Get()
  list(@Headers('x-user-id') userId: string | undefined, @Query() query: Record<string, unknown>) {
    const response = this.favoritesService.listFavorites(mapListFavoritesRequest(userId, query));
    return favoriteListResponseToJson(response);
  }

  @Get(':favoriteId')
  get(@Headers('x-user-id') userId: string | undefined, @Param('favoriteId') favoriteId: string) {
    const response = this.favoritesService.getFavorite(mapGetFavoriteRequest(userId, favoriteId));
    return favoriteGetResponseToJson(response);
  }

  @Patch(':favoriteId')
  update(
    @Headers('x-user-id') userId: string | undefined,
    @Param('favoriteId') favoriteId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const response = this.favoritesService.updateFavorite(mapUpdateFavoriteRequest(userId, favoriteId, body));
    return favoriteUpdateResponseToJson(response);
  }

  @Delete(':favoriteId')
  @HttpCode(200)
  delete(@Headers('x-user-id') userId: string | undefined, @Param('favoriteId') favoriteId: string) {
    const response = this.favoritesService.deleteFavorite(mapDeleteFavoriteRequest(userId, favoriteId));
    return favoriteDeleteResponseToJson(response);
  }

  @Post(':favoriteId/refresh')
  @HttpCode(200)
  refresh(@Headers('x-user-id') userId: string | undefined, @Param('favoriteId') favoriteId: string) {
    const response = this.favoritesService.refreshFavorite(mapRefreshFavoriteRequest(userId, favoriteId));
    return favoriteRefreshResponseToJson(response);
  }
}
