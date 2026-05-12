import { BadRequestException } from '@nestjs/common';
import { create } from '@bufbuild/protobuf';
import { Metadata, status } from '@grpc/grpc-js';
import { FieldMaskSchema } from '@bufbuild/protobuf/wkt';
import {
  DeleteFavoriteRequestSchema,
  FavoritePatchSchema,
  GetFavoriteRequestSchema,
  ListFavoritesRequestSchema,
  RefreshFavoriteRequestSchema,
  UpdateFavoriteRequestSchema,
} from '@findnmeet/ts-types/favorites/v1';
import { PageRequestSchema, Provider, UuidSchema } from '@findnmeet/ts-types/shared/v1';

import { FavoritesGrpcController } from '../src/grpc/controllers/favorites-grpc.controller';
import { HttpExceptionRpcFilter } from '../src/grpc/filters/http-exception-rpc.filter';
import { FavoritesApplicationService } from '../src/favorites/application/favorites.service';
import {
  createFavoriteRequest,
  createRepositoryFake,
  favoriteIdRequest,
  metadataWithUserId,
} from './__fixtures__/favorites';

describe('FavoritesGrpcController', () => {
  let controller: FavoritesGrpcController;

  beforeEach(() => {
    controller = new FavoritesGrpcController(new FavoritesApplicationService(createRepositoryFake()));
  });

  it('creates VK favorite from gateway user metadata', async () => {
    const res = await controller.createFavorite(
      createFavoriteRequest('123456789', 'from search'),
      metadataWithUserId(),
    );

    expect(res.favorite).toMatchObject({
      provider: Provider.VK,
      externalId: '123456789',
      displayTitle: 'VK User 123456789',
      note: 'from search',
    });
    expect(res.favorite?.id?.value).toEqual(expect.any(String));
    expect(res.favorite?.providerDetails.value?.profile?.vkUserId).toBe(BigInt('123456789'));
  });

  it('lists, updates, refreshes and deletes favorites owned by current user', async () => {
    const createRes = await controller.createFavorite(
      createFavoriteRequest('42', ''),
      metadataWithUserId(),
    );
    const favoriteId = createRes.favorite!.id!.value;

    const listRes = await controller.listFavorites(
      create(ListFavoritesRequestSchema, {
        page: create(PageRequestSchema, { pageSize: 10 }),
      }),
      metadataWithUserId(),
    );

    expect(listRes.favorites).toHaveLength(1);
    expect(listRes.favorites[0].id?.value).toBe(favoriteId);

    const updateRes = await controller.updateFavorite(
      create(UpdateFavoriteRequestSchema, {
        favoriteId: create(UuidSchema, { value: favoriteId }),
        patch: create(FavoritePatchSchema, { note: 'updated' }),
        updateMask: create(FieldMaskSchema, { paths: ['note'] }),
      }),
      metadataWithUserId(),
    );

    expect(updateRes.favorite?.note).toBe('updated');

    const refreshRes = await controller.refreshFavorite(favoriteIdRequest(RefreshFavoriteRequestSchema, favoriteId), metadataWithUserId());

    expect(refreshRes.favorite?.id?.value).toBe(favoriteId);
    expect(refreshRes.favorite?.addedAt).toEqual(createRes.favorite?.addedAt);

    await expect(
      controller.deleteFavorite(favoriteIdRequest(DeleteFavoriteRequestSchema, favoriteId), metadataWithUserId()),
    ).resolves.toHaveProperty('$typeName', 'findnmeet.favorites.v1.delete_favorite.DeleteFavoriteResponse');

    await expect(
      controller.getFavorite(favoriteIdRequest(GetFavoriteRequestSchema, favoriteId), metadataWithUserId()),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('does not expose favorites between users', async () => {
    const createRes = await controller.createFavorite(
      createFavoriteRequest('777', ''),
      metadataWithUserId(),
    );

    await expect(
      controller.getFavorite(
        create(GetFavoriteRequestSchema, { favoriteId: createRes.favorite!.id }),
        metadataWithUserId('550e8400-e29b-41d4-a716-446655440001'),
      ),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('rejects duplicate favorite for same provider and external id', async () => {
    await controller.createFavorite(createFavoriteRequest('100'), metadataWithUserId());

    await expect(controller.createFavorite(createFavoriteRequest('100'), metadataWithUserId())).rejects.toMatchObject({
      status: 409,
    });
  });

  it('requires gateway user metadata', async () => {
    expect(() => controller.createFavorite(createFavoriteRequest('100'), new Metadata())).toThrow(
      expect.objectContaining({ status: 401 }),
    );
  });
});

describe('HttpExceptionRpcFilter', () => {
  it('maps Nest HTTP exceptions to gRPC status payloads', (done) => {
    const filter = new HttpExceptionRpcFilter();
    const exception$ = filter.catch(new BadRequestException('Bad input'), {} as never);

    exception$.subscribe({
      error(error) {
        expect(error.getError().code).toBe(status.INVALID_ARGUMENT);
        done();
      },
    });
  });
});
