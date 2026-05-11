import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { create, toJson } from '@bufbuild/protobuf';
import type { JsonObject } from '@bufbuild/protobuf';
import { FieldMaskSchema } from '@bufbuild/protobuf/wkt';
import {
  CreateFavoriteRequestSchema,
  CreateFavoriteResponseSchema,
  DeleteFavoriteRequestSchema,
  DeleteFavoriteResponseSchema,
  FavoritePatchSchema,
  GetFavoriteRequestSchema,
  GetFavoriteResponseSchema,
  ListFavoritesRequestSchema,
  ListFavoritesResponseSchema,
  RefreshFavoriteRequestSchema,
  RefreshFavoriteResponseSchema,
  UpdateFavoriteRequestSchema,
  UpdateFavoriteResponseSchema,
} from '@findnmeet/ts-types/favorites/v1';
import { PageRequestSchema, Provider } from '@findnmeet/ts-types/shared/v1';
import { CurrentUserId } from '@findnmeet/utils/current-user-id.decorator';

import { invalidPageSize, invalidProvider, missingUserContext } from './favorites.exceptions';
import { FavoritesService, createUuid } from './favorites.service';

@Controller('internal/favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  async create(@CurrentUserId() userId: string | undefined, @Body() body: CreateFavoriteBody = {}): Promise<JsonObject> {
    const response = await this.favoritesService.createFavorite(
      create(CreateFavoriteRequestSchema, {
        userId: mapUserId(userId, body),
        provider: parseProvider(body.provider),
        externalId: parseExternalId(body),
        note: String(body.note ?? ''),
      }),
    );

    return toJson(CreateFavoriteResponseSchema, response) as JsonObject;
  }

  @Get()
  async list(@CurrentUserId() userId: string | undefined, @Query() query: ListFavoritesQuery = {}): Promise<JsonObject> {
    const pageSize = parseOptionalInteger(query.page_size ?? query.pageSize);
    const pageToken = parseOptionalString(query.page_token ?? query.pageToken);
    const response = await this.favoritesService.listFavorites(
      create(ListFavoritesRequestSchema, {
        userId: mapUserId(userId),
        provider: parseProvider(query.provider, Provider.UNSPECIFIED),
        page: create(PageRequestSchema, {
          pageSize: pageSize ?? 0,
          pageToken: pageToken ?? '',
        }),
      }),
    );

    return toJson(ListFavoritesResponseSchema, response) as JsonObject;
  }

  @Get(':favoriteId')
  async get(@CurrentUserId() userId: string | undefined, @Param('favoriteId') favoriteId: string): Promise<JsonObject> {
    const response = await this.favoritesService.getFavorite(
      create(GetFavoriteRequestSchema, {
        userId: mapUserId(userId),
        favoriteId: createUuid(favoriteId),
      }),
    );

    return toJson(GetFavoriteResponseSchema, response) as JsonObject;
  }

  @Patch(':favoriteId')
  async update(
    @CurrentUserId() userId: string | undefined,
    @Param('favoriteId') favoriteId: string,
    @Body() body: UpdateFavoriteBody = {},
  ): Promise<JsonObject> {
    const response = await this.favoritesService.updateFavorite(
      create(UpdateFavoriteRequestSchema, {
        userId: mapUserId(userId, body),
        favoriteId: createUuid(favoriteId),
        patch: create(FavoritePatchSchema, { note: String(body.note ?? '') }),
        updateMask: create(FieldMaskSchema, { paths: parseUpdateMask(body.updateMask ?? body.update_mask) }),
      }),
    );

    return toJson(UpdateFavoriteResponseSchema, response) as JsonObject;
  }

  @Delete(':favoriteId')
  @HttpCode(200)
  async delete(@CurrentUserId() userId: string | undefined, @Param('favoriteId') favoriteId: string): Promise<JsonObject> {
    const response = await this.favoritesService.deleteFavorite(
      create(DeleteFavoriteRequestSchema, {
        userId: mapUserId(userId),
        favoriteId: createUuid(favoriteId),
      }),
    );

    return toJson(DeleteFavoriteResponseSchema, response) as JsonObject;
  }

  @Post(':favoriteId/refresh')
  @HttpCode(200)
  async refresh(@CurrentUserId() userId: string | undefined, @Param('favoriteId') favoriteId: string): Promise<JsonObject> {
    const response = await this.favoritesService.refreshFavorite(
      create(RefreshFavoriteRequestSchema, {
        userId: mapUserId(userId),
        favoriteId: createUuid(favoriteId),
      }),
    );

    return toJson(RefreshFavoriteResponseSchema, response) as JsonObject;
  }
}

type FavoriteProviderInput = Provider | 'VK' | 'PROVIDER_VK' | 'PROVIDER_UNSPECIFIED' | '0' | '1';

type CreateFavoriteBody = {
  userId?: string | { value?: string };
  user_id?: string | { value?: string };
  provider?: FavoriteProviderInput;
  externalId?: string | number;
  external_id?: string | number;
  vkUserId?: string | number;
  vk_user_id?: string | number;
  note?: string;
};

type ListFavoritesQuery = {
  provider?: FavoriteProviderInput;
  page_size?: string | string[];
  pageSize?: string | string[];
  page_token?: string | string[];
  pageToken?: string | string[];
};

type UpdateFavoriteBody = {
  userId?: string | { value?: string };
  user_id?: string | { value?: string };
  note?: string;
  updateMask?: string | string[] | { paths?: string[] };
  update_mask?: string | string[] | { paths?: string[] };
};

function mapUserId(headerUserId: string | undefined, body?: CreateFavoriteBody | UpdateFavoriteBody) {
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

function parseExternalId(body: CreateFavoriteBody): string {
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
