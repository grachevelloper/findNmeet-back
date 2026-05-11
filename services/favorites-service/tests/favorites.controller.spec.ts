import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { FavoritesService } from '../src/favorites/favorites.service';

const userId = '550e8400-e29b-41d4-a716-446655440000';

describe('FavoritesController', () => {
  let app: INestApplication;
  let favoritesService: FavoritesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    favoritesService = moduleRef.get(FavoritesService);
    favoritesService.clear();
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
