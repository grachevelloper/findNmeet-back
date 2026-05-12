import { create } from '@bufbuild/protobuf';
import { CreateFavoriteRequestSchema } from '@findnmeet/ts-types/favorites/v1';
import { Provider } from '@findnmeet/ts-types/shared/v1';

import { FavoritesApplicationService } from '../src/favorites/application/favorites.service';
import { createRepositoryFake } from './__fixtures__/favorites';

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
