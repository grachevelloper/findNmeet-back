import { FavoriteProvider } from '../src/favorites/domain/models/favorite-provider';
import { CreateFavoriteUseCase } from '../src/favorites/application/use-cases/create-favorite.use-case';
import { createRepositoryFake } from './__fixtures__/favorites';

const ownerId = '550e8400-e29b-41d4-a716-446655440000';

describe('CreateFavoriteUseCase', () => {
  let useCase: CreateFavoriteUseCase;

  beforeEach(() => {
    useCase = new CreateFavoriteUseCase(createRepositoryFake());
  });

  it('enforces unique user/provider/external id', async () => {
    const command = {
      provider: FavoriteProvider.VK,
      externalId: '123',
      note: '',
    };

    await useCase.execute(ownerId, command);

    await expect(useCase.execute(ownerId, command)).rejects.toThrow(expect.objectContaining({ status: 409 }));
  });

  it('keeps favorites scoped by owner', async () => {
    const favorite = await useCase.execute(ownerId, {
      provider: FavoriteProvider.VK,
      externalId: '456',
      note: '',
    });

    expect(favorite.externalId).toBe('456');
    expect(favorite.ownerId).toBe(ownerId);
  });
});
