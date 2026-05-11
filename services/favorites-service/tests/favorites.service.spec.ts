import { create } from '@bufbuild/protobuf';
import { timestampDate } from '@bufbuild/protobuf/wkt';
import { CreateFavoriteRequestSchema } from '@findnmeet/ts-types/favorites/v1';
import type { Favorite } from '@findnmeet/ts-types/favorites/v1';
import { Provider, UuidSchema } from '@findnmeet/ts-types/shared/v1';

import { FavoritesRepository } from '../src/favorites/favorites.repository';
import type { FavoriteRecord } from '../src/favorites/favorites.repository';
import { FavoritesService } from '../src/favorites/favorites.service';

const userId = create(UuidSchema, { value: '550e8400-e29b-41d4-a716-446655440000' });

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    service = new FavoritesService(createRepositoryFake());
  });

  it('enforces unique user/provider/external id', async () => {
    const request = create(CreateFavoriteRequestSchema, {
      userId,
      provider: Provider.VK,
      externalId: '123',
    });

    await service.createFavorite(request);

    await expect(service.createFavorite(request)).rejects.toThrow(expect.objectContaining({ status: 409 }));
  });

  it('keeps favorites scoped by owner', async () => {
    const favorite = (await service.createFavorite(
      create(CreateFavoriteRequestSchema, {
        userId,
        provider: Provider.VK,
        externalId: '456',
      }),
    )).favorite!;

    expect(favorite.userId?.value).toBe(userId.value);
    expect(favorite.externalId).toBe('456');
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
