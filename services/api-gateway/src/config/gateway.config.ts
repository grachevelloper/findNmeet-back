import {
  CompleteVkOAuthRequestSchema,
  GetUserRequestSchema,
  RefreshSessionRequestSchema,
  RevokeSessionRequestSchema,
} from '@findnmeet/ts-types/auth/v1';
import {
  CreateFavoriteRequestSchema,
  DeleteFavoriteRequestSchema,
  GetFavoriteRequestSchema,
  ListFavoritesRequestSchema,
  RefreshFavoriteRequestSchema,
  UpdateFavoriteRequestSchema,
} from '@findnmeet/ts-types/favorites/v1';

type RouteAuthMode = 'public' | 'required';
type RouteServiceName = 'auth' | 'favorites';
type RequestSource = 'body' | 'query';

export type GatewayRoute = {
  method: 'GET' | 'POST';
  path: string;
  service: RouteServiceName;
  rpc: string;
  auth: RouteAuthMode;
  requestSource: RequestSource;
  requestSchema: object;
  injectUserId?: boolean;
  metadataUserId?: boolean;
};

export type GatewayConfig = {
  accessTokenCookieName: string;
  refreshTokenCookieName: string;
  authServiceGrpcUrl: string;
  favoritesServiceGrpcUrl: string;
  publicEndpoints: string[];
  routes: GatewayRoute[];
};

export function gatewayConfig(): GatewayConfig {
  const routes: GatewayRoute[] = [
    {
      method: 'POST',
      path: '/auth/complete-vk-oauth',
      service: 'auth',
      rpc: 'completeVkOAuth',
      auth: 'public',
      requestSource: 'body',
      requestSchema: CompleteVkOAuthRequestSchema,
    },
    {
      method: 'POST',
      path: '/auth/get-user',
      service: 'auth',
      rpc: 'getUser',
      auth: 'required',
      requestSource: 'body',
      requestSchema: GetUserRequestSchema,
      injectUserId: true,
    },
    {
      method: 'POST',
      path: '/auth/refresh-session',
      service: 'auth',
      rpc: 'refreshSession',
      auth: 'public',
      requestSource: 'body',
      requestSchema: RefreshSessionRequestSchema,
    },
    {
      method: 'POST',
      path: '/auth/revoke-session',
      service: 'auth',
      rpc: 'revokeSession',
      auth: 'public',
      requestSource: 'body',
      requestSchema: RevokeSessionRequestSchema,
    },
    {
      method: 'POST',
      path: '/favorites/create-favorite',
      service: 'favorites',
      rpc: 'createFavorite',
      auth: 'required',
      requestSource: 'body',
      requestSchema: CreateFavoriteRequestSchema,
      metadataUserId: true,
    },
    {
      method: 'POST',
      path: '/favorites/get-favorite',
      service: 'favorites',
      rpc: 'getFavorite',
      auth: 'required',
      requestSource: 'body',
      requestSchema: GetFavoriteRequestSchema,
      metadataUserId: true,
    },
    {
      method: 'POST',
      path: '/favorites/list-favorites',
      service: 'favorites',
      rpc: 'listFavorites',
      auth: 'required',
      requestSource: 'body',
      requestSchema: ListFavoritesRequestSchema,
      metadataUserId: true,
    },
    {
      method: 'POST',
      path: '/favorites/update-favorite',
      service: 'favorites',
      rpc: 'updateFavorite',
      auth: 'required',
      requestSource: 'body',
      requestSchema: UpdateFavoriteRequestSchema,
      metadataUserId: true,
    },
    {
      method: 'POST',
      path: '/favorites/delete-favorite',
      service: 'favorites',
      rpc: 'deleteFavorite',
      auth: 'required',
      requestSource: 'body',
      requestSchema: DeleteFavoriteRequestSchema,
      metadataUserId: true,
    },
    {
      method: 'POST',
      path: '/favorites/refresh-favorite',
      service: 'favorites',
      rpc: 'refreshFavorite',
      auth: 'required',
      requestSource: 'body',
      requestSchema: RefreshFavoriteRequestSchema,
      metadataUserId: true,
    },
  ];

  return {
    accessTokenCookieName: 'fm_access_token',
    refreshTokenCookieName: 'fm_refresh_token',
    authServiceGrpcUrl: process.env.AUTH_SERVICE_GRPC_URL ?? '0.0.0.0:50051',
    favoritesServiceGrpcUrl: process.env.FAVORITES_SERVICE_GRPC_URL ?? '0.0.0.0:50053',
    publicEndpoints: ['/health', ...routes.filter((route) => route.auth === 'public').map((route) => route.path)],
    routes,
  };
}
