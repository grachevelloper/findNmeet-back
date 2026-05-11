import { create } from '@bufbuild/protobuf';
import { timestampDate } from '@bufbuild/protobuf/wkt';
import { CreateFavoriteRequestSchema } from '@findnmeet/ts-types/favorites/v1';
import type { Favorite } from '@findnmeet/ts-types/favorites/v1';
import { Provider } from '@findnmeet/ts-types/shared/v1';

import { FavoritesRepository } from '../src/favorites/favorites.repository';
import type { FavoriteRecord } from '../src/favorites/favorites.repository';
import { FavoritesApplicationService } from '../src/favorites/favorites.service';

const ownerId = '550e8400-e29b-41d4-a716-446655440000';

describe('FavoritesApplicationService', () => {
  let service: FavoritesApplicationService;

  beforeEach(() => {
    service = new FavoritesApplicationService(createRepositoryFake());
  });

  it('enforces unique user/provider/external id', async () => {
    const request = create(CreateFavoriteRequestSchema, {
      provider: Provider.VK,
      externalId: '123',
    });

    await service.createFavorite(ownerId, request);

    await expect(service.createFavorite(ownerId, request)).rejects.toThrow(expect.objectContaining({ status: 409 }));
  });

  it('keeps favorites scoped by owner', async () => {
    const favorite = (await service.createFavorite(
      ownerId,
      create(CreateFavoriteRequestSchema, {
        provider: Provider.VK,
        externalId: '456',
      }),
    )).favorite!;

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
          favorite.ownerId === userId && favorite.provider === provider && favorite.externalId === externalId,
      )?.id?.value;
    },
    async listByOwner(userId: string, provider?: Provider) {
      return [...favorites.values()]
        .filter((favorite) => favorite.ownerId === userId)
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
