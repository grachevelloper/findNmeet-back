import { HttpException } from '@nestjs/common';
import { Code, ConnectError } from '@connectrpc/connect';
import type { ConnectRouter, HandlerContext, ServiceImpl } from '@connectrpc/connect';
import { FavoritesService } from '@findnmeet/ts-types/favorites/v1';

import { FavoritesApplicationService } from './favorites.service';

export function createFavoritesConnectRoutes(favoritesService: FavoritesApplicationService) {
  return (router: ConnectRouter): void => {
    router.service(FavoritesService, createFavoritesServiceImpl(favoritesService));
  };
}

export function createFavoritesServiceImpl(
  favoritesService: FavoritesApplicationService,
): ServiceImpl<typeof FavoritesService> {
  return {
    createFavorite: (request, context) =>
      mapNestException(() => favoritesService.createFavorite(currentUserId(context), request)),
    getFavorite: (request, context) =>
      mapNestException(() => favoritesService.getFavorite(currentUserId(context), request)),
    listFavorites: (request, context) =>
      mapNestException(() => favoritesService.listFavorites(currentUserId(context), request)),
    updateFavorite: (request, context) =>
      mapNestException(() => favoritesService.updateFavorite(currentUserId(context), request)),
    deleteFavorite: (request, context) =>
      mapNestException(() => favoritesService.deleteFavorite(currentUserId(context), request)),
    refreshFavorite: (request, context) =>
      mapNestException(() => favoritesService.refreshFavorite(currentUserId(context), request)),
  };
}

function currentUserId(context: HandlerContext): string {
  const userId = context.requestHeader.get('x-user-id');

  if (!userId) {
    throw new ConnectError('X-User-Id header is required', Code.Unauthenticated);
  }

  return userId;
}

async function mapNestException<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toConnectError(error);
  }
}

function toConnectError(error: unknown): ConnectError {
  if (!(error instanceof HttpException)) {
    return ConnectError.from(error);
  }

  return new ConnectError(extractMessage(error), codeFromStatus(error.getStatus()));
}

function codeFromStatus(status: number): Code {
  switch (status) {
    case 400:
      return Code.InvalidArgument;
    case 401:
      return Code.Unauthenticated;
    case 404:
      return Code.NotFound;
    case 409:
      return Code.AlreadyExists;
    default:
      return Code.Unknown;
  }
}

function extractMessage(error: HttpException): string {
  const response = error.getResponse();

  if (typeof response === 'object' && response !== null && 'error' in response) {
    const errorBody = response.error;

    if (typeof errorBody === 'object' && errorBody !== null && 'message' in errorBody) {
      return String(errorBody.message);
    }
  }

  return error.message;
}
