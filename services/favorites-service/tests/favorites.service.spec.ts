import { FavoriteProvider } from '../src/favorites/domain/models/favorite-provider';
import { FavoritesApplicationService } from '../src/favorites/application/favorites.service';
import { createRepositoryFake } from './__fixtures__/favorites';

const ownerId = '550e8400-e29b-41d4-a716-446655440000';

describe('FavoritesApplicationService', () => {
  let service: FavoritesApplicationService;

  beforeEach(() => {
    service = new FavoritesApplicationService(createRepositoryFake());
  });

  it('enforces unique user/provider/external id', async () => {
    const command = {
      provider: FavoriteProvider.VK,
      externalId: '123',
      note: '',
    };

    await service.createFavorite(ownerId, command);

    await expect(service.createFavorite(ownerId, command)).rejects.toThrow(expect.objectContaining({ status: 409 }));
  });

  it('keeps favorites scoped by owner', async () => {
    const favorite = await service.createFavorite(ownerId, {
      provider: FavoriteProvider.VK,
      externalId: '456',
      note: '',
    });

    expect(favorite.externalId).toBe('456');
  });
});
