import { create } from '@bufbuild/protobuf';
import { CreateFavoriteRequestSchema } from '@findnmeet/ts-types/favorites/v1';
import { Provider, UuidSchema } from '@findnmeet/ts-types/shared/v1';

import { FavoritesRepository } from '../src/favorites/favorites.repository';
import { FavoritesService } from '../src/favorites/favorites.service';

const userId = create(UuidSchema, { value: '550e8400-e29b-41d4-a716-446655440000' });

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    service = new FavoritesService(new FavoritesRepository());
  });

  it('enforces unique user/provider/external id', () => {
    const request = create(CreateFavoriteRequestSchema, {
      userId,
      provider: Provider.VK,
      externalId: '123',
    });

    service.createFavorite(request);

    expect(() => service.createFavorite(request)).toThrow(expect.objectContaining({ status: 409 }));
  });

  it('keeps favorites scoped by owner', () => {
    const favorite = service.createFavorite(
      create(CreateFavoriteRequestSchema, {
        userId,
        provider: Provider.VK,
        externalId: '456',
      }),
    ).favorite!;

    expect(favorite.userId?.value).toBe(userId.value);
    expect(favorite.externalId).toBe('456');
  });
});
