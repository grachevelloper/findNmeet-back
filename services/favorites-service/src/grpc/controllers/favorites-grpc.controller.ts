import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import type {
  CreateFavoriteRequest,
  CreateFavoriteResponse,
  DeleteFavoriteRequest,
  DeleteFavoriteResponse,
  GetFavoriteRequest,
  GetFavoriteResponse,
  ListFavoritesRequest,
  ListFavoritesResponse,
  RefreshFavoriteRequest,
  RefreshFavoriteResponse,
  UpdateFavoriteRequest,
  UpdateFavoriteResponse,
} from '@findnmeet/ts-types/favorites/v1';

import { currentUserId } from '../metadata/current-user-id';
import { FavoritesApplicationService } from '../../favorites/application/favorites.service';

@Controller()
export class FavoritesGrpcController {
  constructor(private readonly favoritesService: FavoritesApplicationService) {}

  @GrpcMethod('FavoritesService', 'CreateFavorite')
  createFavorite(request: CreateFavoriteRequest, metadata: Metadata): Promise<CreateFavoriteResponse> {
    return this.favoritesService.createFavorite(currentUserId(metadata), request);
  }

  @GrpcMethod('FavoritesService', 'GetFavorite')
  getFavorite(request: GetFavoriteRequest, metadata: Metadata): Promise<GetFavoriteResponse> {
    return this.favoritesService.getFavorite(currentUserId(metadata), request);
  }

  @GrpcMethod('FavoritesService', 'ListFavorites')
  listFavorites(request: ListFavoritesRequest, metadata: Metadata): Promise<ListFavoritesResponse> {
    return this.favoritesService.listFavorites(currentUserId(metadata), request);
  }

  @GrpcMethod('FavoritesService', 'UpdateFavorite')
  updateFavorite(request: UpdateFavoriteRequest, metadata: Metadata): Promise<UpdateFavoriteResponse> {
    return this.favoritesService.updateFavorite(currentUserId(metadata), request);
  }

  @GrpcMethod('FavoritesService', 'DeleteFavorite')
  deleteFavorite(request: DeleteFavoriteRequest, metadata: Metadata): Promise<DeleteFavoriteResponse> {
    return this.favoritesService.deleteFavorite(currentUserId(metadata), request);
  }

  @GrpcMethod('FavoritesService', 'RefreshFavorite')
  refreshFavorite(request: RefreshFavoriteRequest, metadata: Metadata): Promise<RefreshFavoriteResponse> {
    return this.favoritesService.refreshFavorite(currentUserId(metadata), request);
  }
}
