import type { GatewayRoute } from '../config/gateway.config';
import { sanitizeProxyResult } from './sanitize-proxy-result';

const route: GatewayRoute = {
  method: 'POST',
  path: '/search/search-people',
  service: 'search',
  rpc: 'searchPeople',
  auth: 'required',
  requestSource: 'body',
  requestSchema: {},
};

describe('sanitizeProxyResult', () => {
  it('converts protobuf long-like values to json strings', () => {
    const result = sanitizeProxyResult(route, {
      result: {
        totalCount: { low: 41, high: 0, unsigned: false },
        profiles: [
          {
            vkUserId: { low: 10001, high: 0, unsigned: false },
            firstName: 'Анна',
          },
        ],
      },
    });

    expect(result).toEqual({
      result: {
        totalCount: '41',
        profiles: [
          {
            vkUserId: '10001',
            firstName: 'Анна',
          },
        ],
      },
    });
  });

  it('removes session tokens from auth responses after cookies are written', () => {
    const result = sanitizeProxyResult(
      {
        ...route,
        writeSessionCookies: true,
      },
      {
        user: { id: { value: 'user-1' } },
        session: {
          accessToken: { value: 'access' },
          refreshToken: { value: 'refresh' },
          expiresAt: { seconds: 1 },
        },
      },
    );

    expect(result).toEqual({
      user: { id: { value: 'user-1' } },
      session: {
        expiresAt: { seconds: 1 },
      },
    });
  });
});
