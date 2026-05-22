import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ListFavoritesRequestSchema } from '@findnmeet/ts-types/favorites/v1';
import { SearchPeopleRequestSchema } from '@findnmeet/ts-types/search/v1';
import { of, throwError } from 'rxjs';

import type { GatewayRoute } from '../config/gateway.config';
import { ProxyService } from './proxy.service';

describe('ProxyService', () => {
  function createService() {
    const service = new ProxyService({} as never, {} as never, {} as never);
    (service as any).authService = {};
    (service as any).favoritesService = {};
    (service as any).searchService = {};
    return service;
  }

  it('dispatches search routes with injected user id', async () => {
    const service = createService();
    const route: GatewayRoute = {
      method: 'POST',
      path: '/search/search-people',
      service: 'search',
      rpc: 'searchPeople',
      auth: 'required',
      requestSource: 'body',
      requestSchema: SearchPeopleRequestSchema,
      injectUserId: true,
    };
    const handler = jest.fn().mockReturnValue(of({ ok: true }));
    (service as any).searchService.searchPeople = handler;

    const result = await service.dispatch(route, { query: 'anna' }, { userId: 'user-1', roles: [] });

    expect(result).toEqual({ ok: true });
    expect(handler.mock.calls[0][0]).toMatchObject({
      query: 'anna',
      userId: { value: 'user-1' },
    });
  });

  it('adds auth metadata for metadataUserId routes', async () => {
    const service = createService();
    const route: GatewayRoute = {
      method: 'POST',
      path: '/favorites/list-favorites',
      service: 'favorites',
      rpc: 'listFavorites',
      auth: 'required',
      requestSource: 'body',
      requestSchema: ListFavoritesRequestSchema,
      metadataUserId: true,
    };
    const handler = jest.fn().mockReturnValue(of({ ok: true }));
    (service as any).favoritesService.listFavorites = handler;

    await service.dispatch(route, {}, { userId: 'user-1', roles: ['member'] });

    expect(handler.mock.calls[0][1].get('x-user-id')).toEqual(['user-1']);
    expect(handler.mock.calls[0][1].get('x-user-roles')).toEqual(['member']);
  });

  it('rejects metadataUserId routes without auth context', async () => {
    const service = createService();
    const route: GatewayRoute = {
      method: 'POST',
      path: '/favorites/list-favorites',
      service: 'favorites',
      rpc: 'listFavorites',
      auth: 'required',
      requestSource: 'body',
      requestSchema: ListFavoritesRequestSchema,
      metadataUserId: true,
    };

    await expect(service.dispatch(route, {}, undefined)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws not found when rpc method is missing', async () => {
    const service = createService();
    const route: GatewayRoute = {
      method: 'POST',
      path: '/search/search-people',
      service: 'search',
      rpc: 'missingMethod',
      auth: 'required',
      requestSource: 'body',
      requestSchema: SearchPeopleRequestSchema,
    };

    await expect(service.dispatch(route, {}, { userId: 'user-1', roles: [] })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps grpc errors into http errors', async () => {
    const service = createService();
    const route: GatewayRoute = {
      method: 'POST',
      path: '/search/search-people',
      service: 'search',
      rpc: 'searchPeople',
      auth: 'required',
      requestSource: 'body',
      requestSchema: SearchPeopleRequestSchema,
    };
    (service as any).searchService.searchPeople = jest
      .fn()
      .mockReturnValue(throwError(() => ({ code: 5, details: 'not found' })));

    await expect(service.dispatch(route, {}, { userId: 'user-1', roles: [] })).rejects.toMatchObject({
      status: 404,
    });
  });
});
