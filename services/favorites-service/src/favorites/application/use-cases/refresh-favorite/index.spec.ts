import { FavoriteProvider } from '../../../domain/models/favorite-provider';
import { createRepositoryFake } from '../../../../../tests/__fixtures__/favorites';
import { CreateFavoriteUseCase } from '../create-favorite';
import { RefreshFavoriteUseCase } from '.';

const ownerId = '550e8400-e29b-41d4-a716-446655440000';

describe('RefreshFavoriteUseCase', () => {
  it('preserves ownership and addedAt while refreshing snapshot metadata', async () => {
    const repository = createRepositoryFake();
    const createFavorite = new CreateFavoriteUseCase(repository);
    const refreshFavorite = new RefreshFavoriteUseCase(repository);
    const favorite = await createFavorite.execute(ownerId, {
      provider: FavoriteProvider.VK,
      externalId: '999',
      note: 'saved',
    });

    await new Promise((resolve) => setTimeout(resolve, 5));
    const refreshed = await refreshFavorite.execute(ownerId, { favoriteId: favorite.id });

    expect(refreshed.id).toBe(favorite.id);
    expect(refreshed.ownerId).toBe(favorite.ownerId);
    expect(refreshed.note).toBe('saved');
    expect(refreshed.addedAt).toEqual(favorite.addedAt);
    expect(refreshed.updatedAt.getTime()).toBeGreaterThan(favorite.updatedAt.getTime());
    expect(refreshed.providerDetails.snapshot.snapshotUpdatedAt.getTime()).toBeGreaterThan(
      favorite.providerDetails.snapshot.snapshotUpdatedAt.getTime(),
    );
  });
});
