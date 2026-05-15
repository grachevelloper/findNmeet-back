import { generateKeyPairSync } from 'crypto';

import { SessionTokens } from '../src/auth/infrastructure/security/session-tokens';

describe('SessionTokens', () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

  it('issues signed access token and opaque refresh token', () => {
    const tokens = new SessionTokens(privatePem, '15m', '30d');
    const session = tokens.issue('550e8400-e29b-41d4-a716-446655440000', new Date('2026-05-13T10:00:00.000Z'));

    expect(session.accessToken.split('.')).toHaveLength(3);
    expect(session.refreshToken).toEqual(expect.any(String));
    expect(session.refreshToken).not.toContain('.');
    expect(session.expiresAt.toISOString()).toBe('2026-05-13T10:15:00.000Z');
  });

  it('hashes refresh tokens with stable comparison', () => {
    const tokens = new SessionTokens(privatePem, '15m', '30d');
    const hash = tokens.hashRefreshToken('refresh-token');

    expect(tokens.equalsRefreshHash('refresh-token', hash)).toBe(true);
    expect(tokens.equalsRefreshHash('another-token', hash)).toBe(false);
  });
});
