import { createHmac, createPrivateKey, randomBytes, sign as cryptoSign, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';

import { SessionTokenManager } from '../../application/ports/session-token-manager';
import type { IssuedSession } from '../../application/dto/issued-session.dto';

type UserAccessTokenPayload = {
  sub: string;
  iat: number;
  exp: number;
  typ: 'access';
  roles?: string[];
};

@Injectable()
export class SessionTokens extends SessionTokenManager {
  private readonly privateKey: string;
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  constructor() {
    super();
    const privateKey = process.env.USER_JWT_PRIVATE_KEY ?? process.env.JWT_PRIVATE_KEY;
    const accessTtl = process.env.USER_JWT_EXPIRES_IN ?? '15m';
    const refreshTtl = process.env.USER_REFRESH_EXPIRES_IN ?? '30d';
    if (!privateKey && process.env.NODE_ENV === 'production') {
      throw new Error('USER_JWT_PRIVATE_KEY or JWT_PRIVATE_KEY is required in production');
    }

    this.privateKey = normalizePem(privateKey) || LOCAL_DEV_PRIVATE_KEY;
    this.accessTtlSeconds = parseDurationSeconds(accessTtl);
    this.refreshTtlSeconds = parseDurationSeconds(refreshTtl);
  }

  issue(userId: string, now = new Date(), roles?: string[]): IssuedSession {
    const issuedAt = Math.floor(now.getTime() / 1000);
    const expiresAt = new Date((issuedAt + this.accessTtlSeconds) * 1000);
    const accessToken = this.sign({
      sub: userId,
      iat: issuedAt,
      exp: issuedAt + this.accessTtlSeconds,
      typ: 'access',
      roles: roles?.length ? roles : undefined,
    });

    return {
      accessToken,
      refreshToken: randomBytes(32).toString('base64url'),
      expiresAt,
    };
  }

  refreshExpiresAt(now = new Date()): Date {
    return new Date(now.getTime() + this.refreshTtlSeconds * 1000);
  }

  hashRefreshToken(refreshToken: string): string {
    return createHmac('sha256', this.privateKey).update(refreshToken).digest('hex');
  }

  equalsRefreshHash(refreshToken: string, hash: string): boolean {
    const nextHash = this.hashRefreshToken(refreshToken);
    const left = Buffer.from(nextHash);
    const right = Buffer.from(hash);

    return left.length === right.length && timingSafeEqual(left, right);
  }

  private sign(payload: UserAccessTokenPayload): string {
    const header = { alg: 'RS256', typ: 'JWT' };
    const encodedHeader = encodeJson(header);
    const encodedPayload = encodeJson(payload);
    const signature = cryptoSign('RSA-SHA256', Buffer.from(`${encodedHeader}.${encodedPayload}`), createPrivateKey(this.privateKey))
      .toString('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function normalizePem(value?: string): string {
  return value?.replace(/\\n/g, '\n').trim() ?? '';
}

function parseDurationSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    throw new Error(`Unsupported duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 24 * 60 * 60;
    default:
      throw new Error(`Unsupported duration: ${value}`);
  }
}

const LOCAL_DEV_PRIVATE_KEY = `
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDVCBh5pTbg+fMR
Mhamt0oR5EtjTp6+wruVFhHvQg0yoQmJVMOpNvC2xO6WhQ2+6y7jNZgDK8YqX6O3
5THXfemly5pPKL9P+QM0L3Sg4a9oTl79yw8vS1mD7hbm16bYgBNoeQjaD0ueBR00
zPlL6bFfUC3j0c8gMx4FwPc74f0u5tYvaf65Izd0NcPV4NpCmTSl8Gf4Ia2qfV9z
6CpiVYfoXKBpq6F0svIwe7yJCjVJjOO0ELaIbgTxrwvjdrczU7s/nOb+RZntsNwP
R0Zh+WFa69f7Ir/ia+Q+Jf6KgdPf7M8vS20f5pLZk3ffJQW3pWw2EN6PZYuhDKca
uuvSmyCXAgMBAAECggEAEXEc5KtN+Jwr7g9a26FrnL25PpvP0U9kYI7taVWwR5Me
0jS+b4mEc4WHybAYllf8ZL9dESqkYgTVbaMrckXkPK7hJZoGqgpxCgTIQJaoZ4gA
vAV8qEaosqxxynIkmqX3YeIec9Y3jEaA6x+nXPTHlhFgZixLQ9VA89lAmnB2NhKt
VCH1J6vGKk9PmRlj7IR7mYPFOHvVB3XJXoL28fJ/z3TAuhvPGt8m7hzIhjP77cXQ
0HPSAw3zoCSNb2k+3PaYvRynwz9glAVWQRVv0zl/j0doOvj9AN42viJmVWEI/T9U
nF0A8mN4qr2dvJ6CA8GZ43SbsE6blm2W/f4H2+bxAQKBgQD1p21BWr4m1sC9pEzG
t4nN8j5UY9hufH/Ll2lMGVP1WqJIEk1qzYZX7PnJqVNisGAXV2tydsv5d3gK5Gus
q/5teww0scylHGYlQqCH8ZV68FYh2/PgXjcdPL4M/HTrvJjqD++J0QHPZZF6hI78
+QRyLhVwqK1FRHgEkbNQDnUhGQKBgQDeq5GKgCfoPQH2Op5v9a0B2/Y9fKETkBi9
qLoJzNTpcD3M1X6P9Q+MC6kFzcr4kmUfe9jRjBhEk7mI1jQoBqaGzWjj+M11gb7l
w1zV0YDQ6bapQlw5lVNyK7tBx+t1D+j8VuYCJnL9P7Bwxn0AjDUz45g4N75WimO7
hdqQxvkzTQKBgQC1HnHr7LDTyV0k/q1D0+l28FzYXh2dZVJ8qrMf54/Z1VJwzkE+
xL12j9mMgI3NqADw7QmDzc6hPUkGI0uawKj3+2QfoZHJ6QFrnmNuGrX7A3n+x0x1
b96m9IjuDsk7Yg2H4vUgVSBKovvq5Hc4/yJxL6U6lbvU/3J8QKr6mNFlAQKBgAe4
X69u6M7FKU2vNAAhqq1I7l/5E4T6xCZ+lp0fhwhGawyiE9uJ8NqB2YkjTQ2ehq9B
lg54Wdu2WzWqlfuVY4eb2VJ+H3cAGz/0cY97JJbADxw+HvW7eYEu6xOl5u5PRU+t
0S4DphNoH8roFKElWbYv/H46RNM4q6E+58f7S0WpAoGAUvjaSjsGoLG4QrHiM0CM
Hwos1vKJ8n8sX5D4JEDXazIh7dXvSP4w9vL5Za6rWrSFT1+BTZ+s1W7FduE+3Qh/
POnpJGqyr1vyElAnSoHgwPVA5h6wI0K4ra6I4B6jS1ACUrXm4jV16gF5tJQpeAVe
bh3KjX5Ekxly1HFQh5I5Wn8=
-----END PRIVATE KEY-----
`.trim();
