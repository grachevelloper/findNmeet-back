import { create, toJson } from '@bufbuild/protobuf';
import { FieldMaskSchema } from '@bufbuild/protobuf/wkt';
import {
  CreateFavoriteRequestSchema,
  CreateFavoriteResponse,
  CreateFavoriteResponseSchema,
  DeleteFavoriteRequestSchema,
  DeleteFavoriteResponse,
  DeleteFavoriteResponseSchema,
  FavoritePatchSchema,
  GetFavoriteRequestSchema,
  GetFavoriteResponse,
  GetFavoriteResponseSchema,
  ListFavoritesRequestSchema,
  ListFavoritesResponse,
  ListFavoritesResponseSchema,
  RefreshFavoriteRequestSchema,
  RefreshFavoriteResponse,
  RefreshFavoriteResponseSchema,
  UpdateFavoriteRequestSchema,
  UpdateFavoriteResponse,
  UpdateFavoriteResponseSchema,
} from '@findnmeet/ts-types/favorites/v1';
import { PageRequestSchema, Provider } from '@findnmeet/ts-types/shared/v1';

import { invalidPageSize, invalidProvider, missingUserContext } from './favorites.exceptions';
import { createUuid } from './favorites.service';

type Body = Record<string, unknown>;
type Query = Record<string, unknown>;

export function mapCreateFavoriteRequest(userId: string | undefined, body: Body) {
  return create(CreateFavoriteRequestSchema, {
    userId: mapUserId(userId, body),
    provider: parseProvider(body.provider),
    externalId: parseExternalId(body),
    note: String(body.note ?? ''),
  });
}

export function mapListFavoritesRequest(userId: string | undefined, query: Query) {
  const pageSize = parseOptionalInteger(query.page_size ?? query.pageSize);
  const pageToken = parseOptionalString(query.page_token ?? query.pageToken);

  return create(ListFavoritesRequestSchema, {
    userId: mapUserId(userId),
    provider: parseProvider(query.provider, Provider.UNSPECIFIED),
    page: create(PageRequestSchema, {
      pageSize: pageSize ?? 0,
      pageToken: pageToken ?? '',
    }),
  });
}

export function mapGetFavoriteRequest(userId: string | undefined, favoriteId: string) {
  return create(GetFavoriteRequestSchema, {
    userId: mapUserId(userId),
    favoriteId: createUuid(favoriteId),
  });
}

export function mapUpdateFavoriteRequest(userId: string | undefined, favoriteId: string, body: Body) {
  const updateMask = parseUpdateMask(body.updateMask ?? body.update_mask);

  return create(UpdateFavoriteRequestSchema, {
    userId: mapUserId(userId, body),
    favoriteId: createUuid(favoriteId),
    patch: create(FavoritePatchSchema, { note: String(body.note ?? '') }),
    updateMask: create(FieldMaskSchema, { paths: updateMask }),
  });
}

export function mapDeleteFavoriteRequest(userId: string | undefined, favoriteId: string) {
  return create(DeleteFavoriteRequestSchema, {
    userId: mapUserId(userId),
    favoriteId: createUuid(favoriteId),
  });
}

export function mapRefreshFavoriteRequest(userId: string | undefined, favoriteId: string) {
  return create(RefreshFavoriteRequestSchema, {
    userId: mapUserId(userId),
    favoriteId: createUuid(favoriteId),
  });
}

export function favoriteCreateResponseToJson(response: CreateFavoriteResponse) {
  return toJson(CreateFavoriteResponseSchema, response);
}

export function favoriteGetResponseToJson(response: GetFavoriteResponse) {
  return toJson(GetFavoriteResponseSchema, response);
}

export function favoriteListResponseToJson(response: ListFavoritesResponse) {
  return toJson(ListFavoritesResponseSchema, response);
}

export function favoriteUpdateResponseToJson(response: UpdateFavoriteResponse) {
  return toJson(UpdateFavoriteResponseSchema, response);
}

export function favoriteDeleteResponseToJson(response: DeleteFavoriteResponse) {
  return toJson(DeleteFavoriteResponseSchema, response);
}

export function favoriteRefreshResponseToJson(response: RefreshFavoriteResponse) {
  return toJson(RefreshFavoriteResponseSchema, response);
}

function mapUserId(headerUserId: string | undefined, body?: Body) {
  const bodyUserId = getOptionalUuidLikeValue(body?.userId) ?? getOptionalUuidLikeValue(body?.user_id);
  const userId = headerUserId ?? bodyUserId;

  if (!userId || typeof userId !== 'string') {
    throw missingUserContext();
  }

  return createUuid(userId);
}

function getOptionalUuidLikeValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'value' in value && typeof value.value === 'string') {
    return value.value;
  }

  return undefined;
}

function parseProvider(value: unknown, defaultProvider?: Provider): Provider {
  if (value === undefined || value === null || value === '') {
    return defaultProvider ?? Provider.UNSPECIFIED;
  }

  if (value === Provider.VK || value === '1' || value === 'VK' || value === 'PROVIDER_VK') {
    return Provider.VK;
  }

  if (value === Provider.UNSPECIFIED || value === '0' || value === 'PROVIDER_UNSPECIFIED') {
    return Provider.UNSPECIFIED;
  }

  throw invalidProvider();
}

function parseExternalId(body: Body): string {
  const externalId = body.externalId ?? body.external_id ?? body.vkUserId ?? body.vk_user_id;

  if (externalId === undefined || externalId === null) {
    return '';
  }

  return String(externalId);
}

function parseOptionalInteger(value: unknown): number | undefined {
  const raw = parseOptionalString(value);

  if (raw === undefined) {
    return undefined;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed)) {
    throw invalidPageSize();
  }

  return parsed;
}

function parseOptionalString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return String(value[0]);
  }

  return String(value);
}

function parseUpdateMask(value: unknown): string[] {
  if (value === undefined || value === null) {
    return ['note'];
  }

  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === 'object' && 'paths' in value && Array.isArray(value.paths)) {
    return value.paths.map(String);
  }

  return String(value)
    .split(',')
    .map((path) => path.trim())
    .filter(Boolean);
}
