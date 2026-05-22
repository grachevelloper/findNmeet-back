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
import { CreateFavoriteUseCase } from '../../../favorites/application/use-cases/create-favorite';
import { DeleteFavoriteUseCase } from '../../../favorites/application/use-cases/delete-favorite';
import { GetFavoriteUseCase } from '../../../favorites/application/use-cases/get-favorite';
import { ListFavoritesUseCase } from '../../../favorites/application/use-cases/list-favorites';
import { RefreshFavoriteUseCase } from '../../../favorites/application/use-cases/refresh-favorite';
import { UpdateFavoriteUseCase } from '../../../favorites/application/use-cases/update-favorite';
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
  constructor(
    private readonly createFavoriteUseCase: CreateFavoriteUseCase,
    private readonly getFavoriteUseCase: GetFavoriteUseCase,
    private readonly listFavoritesUseCase: ListFavoritesUseCase,
    private readonly updateFavoriteUseCase: UpdateFavoriteUseCase,
    private readonly deleteFavoriteUseCase: DeleteFavoriteUseCase,
    private readonly refreshFavoriteUseCase: RefreshFavoriteUseCase,
  ) {}

  @GrpcMethod('FavoritesService', 'CreateFavorite')
  async createFavorite(request: CreateFavoriteRequest, metadata: Metadata): Promise<CreateFavoriteResponse> {
    const favorite = await this.createFavoriteUseCase.execute(
      currentUserId(metadata),
      createFavoriteCommandFromProto(request),
    );
    return createFavoriteResponseToProto(favorite);
  }

  @GrpcMethod('FavoritesService', 'GetFavorite')
  async getFavorite(request: GetFavoriteRequest, metadata: Metadata): Promise<GetFavoriteResponse> {
    const favorite = await this.getFavoriteUseCase.execute(currentUserId(metadata), getFavoriteQueryFromProto(request));
    return getFavoriteResponseToProto(favorite);
  }

  @GrpcMethod('FavoritesService', 'ListFavorites')
  async listFavorites(request: ListFavoritesRequest, metadata: Metadata): Promise<ListFavoritesResponse> {
    const result = await this.listFavoritesUseCase.execute(
      currentUserId(metadata),
      listFavoritesQueryFromProto(request),
    );
    return listFavoritesResponseToProto(result);
  }

  @GrpcMethod('FavoritesService', 'UpdateFavorite')
  async updateFavorite(request: UpdateFavoriteRequest, metadata: Metadata): Promise<UpdateFavoriteResponse> {
    const favorite = await this.updateFavoriteUseCase.execute(
      currentUserId(metadata),
      updateFavoriteCommandFromProto(request),
    );
    return updateFavoriteResponseToProto(favorite);
  }

  @GrpcMethod('FavoritesService', 'DeleteFavorite')
  async deleteFavorite(request: DeleteFavoriteRequest, metadata: Metadata): Promise<DeleteFavoriteResponse> {
    await this.deleteFavoriteUseCase.execute(currentUserId(metadata), deleteFavoriteCommandFromProto(request));
    return deleteFavoriteResponseToProto();
  }

  @GrpcMethod('FavoritesService', 'RefreshFavorite')
  async refreshFavorite(request: RefreshFavoriteRequest, metadata: Metadata): Promise<RefreshFavoriteResponse> {
    const favorite = await this.refreshFavoriteUseCase.execute(
      currentUserId(metadata),
      refreshFavoriteCommandFromProto(request),
    );
    return refreshFavoriteResponseToProto(favorite);
  }
}
