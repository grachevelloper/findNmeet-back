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
import { SearchPeopleRequestSchema } from '@findnmeet/ts-types/search/v1';

type RouteAuthMode = 'public' | 'required';
type RouteServiceName = 'auth' | 'favorites' | 'search';
type RequestSource = 'body' | 'query';
type CookieSameSite = 'lax' | 'strict' | 'none';

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
  readRefreshTokenFromCookie?: boolean;
  writeSessionCookies?: boolean;
  clearSessionCookies?: boolean;
};

export type GatewayConfig = {
  accessTokenCookieName: string;
  refreshTokenCookieName: string;
  cookieSecure: boolean;
  cookieSameSite: CookieSameSite;
  authServiceGrpcUrl: string;
  favoritesServiceGrpcUrl: string;
  aiServiceGrpcUrl: string;
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
      writeSessionCookies: true,
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
      readRefreshTokenFromCookie: true,
      writeSessionCookies: true,
    },
    {
      method: 'POST',
      path: '/auth/revoke-session',
      service: 'auth',
      rpc: 'revokeSession',
      auth: 'public',
      requestSource: 'body',
      requestSchema: RevokeSessionRequestSchema,
      readRefreshTokenFromCookie: true,
      clearSessionCookies: true,
    },
    {
      method: 'POST',
      path: '/search/search-people',
      service: 'search',
      rpc: 'searchPeople',
      auth: 'required',
      requestSource: 'body',
      requestSchema: SearchPeopleRequestSchema,
      injectUserId: true,
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
    cookieSecure: parseBoolean(process.env.API_GATEWAY_COOKIE_SECURE, process.env.NODE_ENV === 'production'),
    cookieSameSite: parseSameSite(process.env.API_GATEWAY_COOKIE_SAME_SITE),
    authServiceGrpcUrl: process.env.AUTH_SERVICE_GRPC_URL ?? '0.0.0.0:50051',
    favoritesServiceGrpcUrl: process.env.FAVORITES_SERVICE_GRPC_URL ?? '0.0.0.0:50053',
    aiServiceGrpcUrl: process.env.AI_SERVICE_GRPC_URL ?? '0.0.0.0:50053',
    publicEndpoints: ['/health', ...routes.filter((route) => route.auth === 'public').map((route) => route.path)],
    routes,
  };
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
}

function parseSameSite(value: string | undefined): CookieSameSite {
  if (value === 'strict' || value === 'none') {
    return value;
  }

  return 'lax';
}
