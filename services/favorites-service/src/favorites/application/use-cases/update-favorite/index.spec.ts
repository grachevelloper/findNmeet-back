import { FavoriteProvider } from '../../../domain/models/favorite-provider';
import { createRepositoryFake } from '../../../../../tests/__fixtures__/favorites';
import { CreateFavoriteUseCase } from '../create-favorite';
import { UpdateFavoriteUseCase } from '.';

const ownerId = '550e8400-e29b-41d4-a716-446655440000';

describe('UpdateFavoriteUseCase', () => {
  it('rejects unsupported update mask paths', async () => {
    const repository = createRepositoryFake();
    const createFavorite = new CreateFavoriteUseCase(repository);
    const updateFavorite = new UpdateFavoriteUseCase(repository);
    const favorite = await createFavorite.execute(ownerId, {
      provider: FavoriteProvider.VK,
      externalId: '123',
      note: 'initial',
    });

    await expect(
      updateFavorite.execute(ownerId, {
        favoriteId: favorite.id,
        note: 'updated',
        updateMaskPaths: ['display_title'],
      }),
    ).rejects.toThrow(expect.objectContaining({ status: 400 }));
  });
});
