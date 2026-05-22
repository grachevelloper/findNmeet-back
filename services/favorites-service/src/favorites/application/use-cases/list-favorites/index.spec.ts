import { FavoriteProvider } from '../../../domain/models/favorite-provider';
import { createRepositoryFake } from '../../../../../tests/__fixtures__/favorites';
import { CreateFavoriteUseCase } from '../create-favorite';
import { ListFavoritesUseCase } from '.';

const ownerId = '550e8400-e29b-41d4-a716-446655440000';

describe('ListFavoritesUseCase', () => {
  it('paginates by page token and returns next page token', async () => {
    const repository = createRepositoryFake();
    const createFavorite = new CreateFavoriteUseCase(repository);
    const listFavorites = new ListFavoritesUseCase(repository);

    await createFavorite.execute(ownerId, { provider: FavoriteProvider.VK, externalId: '1', note: '' });
    await createFavorite.execute(ownerId, { provider: FavoriteProvider.VK, externalId: '2', note: '' });
    await createFavorite.execute(ownerId, { provider: FavoriteProvider.VK, externalId: '3', note: '' });

    const firstPage = await listFavorites.execute(ownerId, { pageSize: 2, pageToken: '' });
    const secondPage = await listFavorites.execute(ownerId, {
      pageSize: 2,
      pageToken: firstPage.nextPageToken,
    });

    expect(firstPage.favorites).toHaveLength(2);
    expect(firstPage.nextPageToken).toBe('2');
    expect(secondPage.favorites).toHaveLength(1);
    expect(secondPage.nextPageToken).toBe('');
  });

  it('rejects invalid page token', async () => {
    const listFavorites = new ListFavoritesUseCase(createRepositoryFake());

    await expect(
      listFavorites.execute(ownerId, {
        pageSize: 10,
        pageToken: 'bad-token',
      }),
    ).rejects.toThrow(expect.objectContaining({ status: 400 }));
  });
});
