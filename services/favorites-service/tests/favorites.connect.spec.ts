import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { expressConnectMiddleware } from '@connectrpc/connect-express';
import { createValidateInterceptor } from '@connectrpc/validate';
import { timestampDate } from '@bufbuild/protobuf/wkt';
import type { Favorite } from '@findnmeet/ts-types/favorites/v1';
import { Provider } from '@findnmeet/ts-types/shared/v1';
import request from 'supertest';

import { createFavoritesConnectRoutes } from '../src/favorites/favorites.connect';
import { FavoritesRepository } from '../src/favorites/favorites.repository';
import type { FavoriteRecord } from '../src/favorites/favorites.repository';
import { FavoritesApplicationService } from '../src/favorites/favorites.service';

const userId = '550e8400-e29b-41d4-a716-446655440000';
const rpcPath = '/findnmeet.favorites.v1.FavoritesService';

describe('Favorites Connect API', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        FavoritesApplicationService,
        {
          provide: FavoritesRepository,
          useValue: createRepositoryFake(),
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    const favoritesService = app.get(FavoritesApplicationService);
    app.use(
      expressConnectMiddleware({
        interceptors: [createValidateInterceptor()],
        routes: createFavoritesConnectRoutes(favoritesService),
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates VK favorite from gateway user context', async () => {
    const res = await connectPost(app, 'CreateFavorite', {
      provider: 'PROVIDER_VK',
      externalId: '123456789',
      note: 'from search',
    });

    expect(res.status).toBe(200);
    expect(res.body.favorite).toMatchObject({
      provider: 'PROVIDER_VK',
      externalId: '123456789',
      displayTitle: 'VK User 123456789',
      note: 'from search',
    });
    expect(res.body.favorite.id.value).toEqual(expect.any(String));
    expect(res.body.favorite.vkSnapshot.profile.vkUserId).toBe('123456789');
  });

  it('lists, updates, refreshes and deletes favorites owned by current user', async () => {
    const createRes = await connectPost(app, 'CreateFavorite', {
      provider: 'PROVIDER_VK',
      externalId: '42',
    });
    const favoriteId = createRes.body.favorite.id.value;

    const listRes = await connectPost(app, 'ListFavorites', {
      page: { pageSize: 10 },
    });

    expect(listRes.status).toBe(200);
    expect(listRes.body.favorites).toHaveLength(1);
    expect(listRes.body.favorites[0].id.value).toBe(favoriteId);

    const updateRes = await connectPost(app, 'UpdateFavorite', {
      favoriteId: { value: favoriteId },
      patch: { note: 'updated' },
      updateMask: 'note',
    });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.favorite.note).toBe('updated');

    const refreshRes = await connectPost(app, 'RefreshFavorite', {
      favoriteId: { value: favoriteId },
    });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.favorite.id.value).toBe(favoriteId);
    expect(refreshRes.body.favorite.addedAt).toEqual(createRes.body.favorite.addedAt);

    const deleteRes = await connectPost(app, 'DeleteFavorite', {
      favoriteId: { value: favoriteId },
    });

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toEqual({});

    const getDeletedRes = await connectPost(app, 'GetFavorite', {
      favoriteId: { value: favoriteId },
    });

    expect(getDeletedRes.status).toBe(404);
  });

  it('does not expose favorites between users', async () => {
    const createRes = await connectPost(app, 'CreateFavorite', {
      provider: 'PROVIDER_VK',
      externalId: '777',
    });
    const favoriteId = createRes.body.favorite.id.value;

    const otherUserRes = await connectPost(
      app,
      'GetFavorite',
      {
        favoriteId: { value: favoriteId },
      },
      '550e8400-e29b-41d4-a716-446655440001',
    );

    expect(otherUserRes.status).toBe(404);
  });

  it('rejects duplicate favorite for same provider and external id', async () => {
    await connectPost(app, 'CreateFavorite', {
      provider: 'PROVIDER_VK',
      externalId: '100',
    });

    const duplicateRes = await connectPost(app, 'CreateFavorite', {
      provider: 'PROVIDER_VK',
      externalId: '100',
    });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.code).toBe('already_exists');
  });

  it('requires gateway user context', async () => {
    const res = await request(app.getHttpServer())
      .post(`${rpcPath}/CreateFavorite`)
      .set('Content-Type', 'application/json')
      .send({ provider: 'PROVIDER_VK', externalId: '100' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('unauthenticated');
  });
});

function connectPost(app: INestApplication, method: string, body: object, currentUserId = userId) {
  return request(app.getHttpServer())
    .post(`${rpcPath}/${method}`)
    .set('Content-Type', 'application/json')
    .set('X-User-Id', currentUserId)
    .send(body);
}

function createRepositoryFake(): FavoritesRepository {
  const favorites = new Map<string, FavoriteRecord>();

  return {
    async findById(favoriteId: string) {
      return favorites.get(favoriteId);
    },
    async findDuplicateFavoriteId(ownerId: string, provider: Provider, externalId: string) {
      return [...favorites.values()].find(
        (favorite) =>
          favorite.ownerId === ownerId && favorite.provider === provider && favorite.externalId === externalId,
      )?.id?.value;
    },
    async listByOwner(ownerId: string, provider?: Provider) {
      return [...favorites.values()]
        .filter((favorite) => favorite.ownerId === ownerId)
        .filter((favorite) => provider === undefined || favorite.provider === provider)
        .sort((a, b) => b.sortKey - a.sortKey);
    },
    async save(favorite: Favorite, ownerId: string) {
      favorites.set(favorite.id!.value, {
        ...favorite,
        ownerId,
        sortKey: timestampDate(favorite.addedAt!).getTime(),
      });
    },
    async delete(favorite: Favorite) {
      favorites.delete(favorite.id!.value);
    },
  } as FavoritesRepository;
}
