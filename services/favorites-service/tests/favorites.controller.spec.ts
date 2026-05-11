import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { timestampDate } from '@bufbuild/protobuf/wkt';
import type { Favorite } from '@findnmeet/ts-types/favorites/v1';
import { Provider } from '@findnmeet/ts-types/shared/v1';
import request from 'supertest';

import { FavoritesController } from '../src/favorites/favorites.controller';
import { FavoritesRepository } from '../src/favorites/favorites.repository';
import type { FavoriteRecord } from '../src/favorites/favorites.repository';
import { FavoritesService } from '../src/favorites/favorites.service';

const userId = '550e8400-e29b-41d4-a716-446655440000';

describe('FavoritesController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        FavoritesService,
        {
          provide: FavoritesRepository,
          useValue: createRepositoryFake(),
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates VK favorite from gateway user context', async () => {
    const res = await request(app.getHttpServer())
      .post('/internal/favorites')
      .set('X-User-Id', userId)
      .send({ provider: 'VK', vk_user_id: 123456789, note: 'from search' });

    expect(res.status).toBe(201);
    expect(res.body.favorite).toMatchObject({
      userId: { value: userId },
      provider: 'PROVIDER_VK',
      externalId: '123456789',
      displayTitle: 'VK User 123456789',
      note: 'from search',
    });
    expect(res.body.favorite.id.value).toEqual(expect.any(String));
    expect(res.body.favorite.vkSnapshot.profile.vkUserId).toBe('123456789');
  });

  it('lists, updates, refreshes and deletes favorites owned by current user', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/internal/favorites')
      .set('X-User-Id', userId)
      .send({ provider: 'PROVIDER_VK', externalId: '42' });
    const favoriteId = createRes.body.favorite.id.value;

    const listRes = await request(app.getHttpServer())
      .get('/internal/favorites?page_size=10')
      .set('X-User-Id', userId);

    expect(listRes.status).toBe(200);
    expect(listRes.body.favorites).toHaveLength(1);
    expect(listRes.body.favorites[0].id.value).toBe(favoriteId);

    const updateRes = await request(app.getHttpServer())
      .patch(`/internal/favorites/${favoriteId}`)
      .set('X-User-Id', userId)
      .send({ note: 'updated' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.favorite.note).toBe('updated');

    const refreshRes = await request(app.getHttpServer())
      .post(`/internal/favorites/${favoriteId}/refresh`)
      .set('X-User-Id', userId);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.favorite.id.value).toBe(favoriteId);
    expect(refreshRes.body.favorite.addedAt).toEqual(createRes.body.favorite.addedAt);

    const deleteRes = await request(app.getHttpServer())
      .delete(`/internal/favorites/${favoriteId}`)
      .set('X-User-Id', userId);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toEqual({});

    const getDeletedRes = await request(app.getHttpServer())
      .get(`/internal/favorites/${favoriteId}`)
      .set('X-User-Id', userId);

    expect(getDeletedRes.status).toBe(404);
  });

  it('does not expose favorites between users', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/internal/favorites')
      .set('X-User-Id', userId)
      .send({ provider: 'VK', vk_user_id: 777 });
    const favoriteId = createRes.body.favorite.id.value;

    const otherUserRes = await request(app.getHttpServer())
      .get(`/internal/favorites/${favoriteId}`)
      .set('X-User-Id', '550e8400-e29b-41d4-a716-446655440001');

    expect(otherUserRes.status).toBe(404);
  });

  it('rejects duplicate favorite for same provider and external id', async () => {
    await request(app.getHttpServer())
      .post('/internal/favorites')
      .set('X-User-Id', userId)
      .send({ provider: 'VK', vk_user_id: 100 });

    const duplicateRes = await request(app.getHttpServer())
      .post('/internal/favorites')
      .set('X-User-Id', userId)
      .send({ provider: 'VK', vk_user_id: 100 });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.code).toBe('favorite_exists');
  });

  it('requires gateway user context', async () => {
    const res = await request(app.getHttpServer())
      .post('/internal/favorites')
      .send({ provider: 'VK', vk_user_id: 100 });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('missing_user_context');
  });
});

function createRepositoryFake(): FavoritesRepository {
  const favorites = new Map<string, FavoriteRecord>();

  return {
    async findById(favoriteId: string) {
      return favorites.get(favoriteId);
    },
    async findDuplicateFavoriteId(userId: string, provider: Provider, externalId: string) {
      return [...favorites.values()].find(
        (favorite) =>
          favorite.userId?.value === userId && favorite.provider === provider && favorite.externalId === externalId,
      )?.id?.value;
    },
    async listByOwner(userId: string, provider?: Provider) {
      return [...favorites.values()]
        .filter((favorite) => favorite.userId?.value === userId)
        .filter((favorite) => provider === undefined || favorite.provider === provider)
        .sort((a, b) => b.sortKey - a.sortKey);
    },
    async save(favorite: Favorite) {
      favorites.set(favorite.id!.value, {
        ...favorite,
        sortKey: timestampDate(favorite.addedAt!).getTime(),
      });
    },
    async delete(favorite: Favorite) {
      favorites.delete(favorite.id!.value);
    },
  } as FavoritesRepository;
}
