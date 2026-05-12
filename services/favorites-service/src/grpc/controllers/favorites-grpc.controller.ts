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
import {
  createFavoriteCommandFromProto,
  createFavoriteResponseToProto,
  deleteFavoriteCommandFromProto,
  deleteFavoriteResponseToProto,
  getFavoriteQueryFromProto,
  getFavoriteResponseToProto,
  listFavoritesQueryFromProto,
  listFavoritesResponseToProto,
  refreshFavoriteCommandFromProto,
  refreshFavoriteResponseToProto,
  updateFavoriteCommandFromProto,
  updateFavoriteResponseToProto,
} from '../mappers/favorites-protobuf.mapper';

@Controller()
export class FavoritesGrpcController {
  constructor(private readonly favoritesService: FavoritesApplicationService) {}

  @GrpcMethod('FavoritesService', 'CreateFavorite')
  async createFavorite(request: CreateFavoriteRequest, metadata: Metadata): Promise<CreateFavoriteResponse> {
    const favorite = await this.favoritesService.createFavorite(
      currentUserId(metadata),
      createFavoriteCommandFromProto(request),
    );
    return createFavoriteResponseToProto(favorite);
  }

  @GrpcMethod('FavoritesService', 'GetFavorite')
  async getFavorite(request: GetFavoriteRequest, metadata: Metadata): Promise<GetFavoriteResponse> {
    const favorite = await this.favoritesService.getFavorite(currentUserId(metadata), getFavoriteQueryFromProto(request));
    return getFavoriteResponseToProto(favorite);
  }

  @GrpcMethod('FavoritesService', 'ListFavorites')
  async listFavorites(request: ListFavoritesRequest, metadata: Metadata): Promise<ListFavoritesResponse> {
    const result = await this.favoritesService.listFavorites(
      currentUserId(metadata),
      listFavoritesQueryFromProto(request),
    );
    return listFavoritesResponseToProto(result);
  }

  @GrpcMethod('FavoritesService', 'UpdateFavorite')
  async updateFavorite(request: UpdateFavoriteRequest, metadata: Metadata): Promise<UpdateFavoriteResponse> {
    const favorite = await this.favoritesService.updateFavorite(
      currentUserId(metadata),
      updateFavoriteCommandFromProto(request),
    );
    return updateFavoriteResponseToProto(favorite);
  }

  @GrpcMethod('FavoritesService', 'DeleteFavorite')
  async deleteFavorite(request: DeleteFavoriteRequest, metadata: Metadata): Promise<DeleteFavoriteResponse> {
    await this.favoritesService.deleteFavorite(currentUserId(metadata), deleteFavoriteCommandFromProto(request));
    return deleteFavoriteResponseToProto();
  }

  @GrpcMethod('FavoritesService', 'RefreshFavorite')
  async refreshFavorite(request: RefreshFavoriteRequest, metadata: Metadata): Promise<RefreshFavoriteResponse> {
    const favorite = await this.favoritesService.refreshFavorite(
      currentUserId(metadata),
      refreshFavoriteCommandFromProto(request),
    );
    return refreshFavoriteResponseToProto(favorite);
  }
}
