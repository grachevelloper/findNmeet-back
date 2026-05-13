import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

import type { AuthSession } from '../../domain/models/auth-session';

type JwtPayload = {
  sub: string;
  iat: number;
  exp: number;
  typ: 'access';
};

export class SessionTokens {
  private readonly secret: string;
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  constructor(
    secret = process.env.USER_JWT_SECRET,
    accessTtl = process.env.USER_JWT_EXPIRES_IN ?? '15m',
    refreshTtl = process.env.USER_REFRESH_EXPIRES_IN ?? '30d',
  ) {
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('USER_JWT_SECRET is required in production');
    }

    this.secret = secret || 'findnmeet-local-user-jwt-secret';
    this.accessTtlSeconds = parseDurationSeconds(accessTtl);
    this.refreshTtlSeconds = parseDurationSeconds(refreshTtl);
  }

  issue(userId: string, now = new Date()): AuthSession {
    const issuedAt = Math.floor(now.getTime() / 1000);
    const expiresAt = new Date((issuedAt + this.accessTtlSeconds) * 1000);
    const accessToken = this.sign({
      sub: userId,
      iat: issuedAt,
      exp: issuedAt + this.accessTtlSeconds,
      typ: 'access',
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
    return createHmac('sha256', this.secret).update(refreshToken).digest('hex');
  }

  equalsRefreshHash(refreshToken: string, hash: string): boolean {
    const nextHash = this.hashRefreshToken(refreshToken);
    const left = Buffer.from(nextHash);
    const right = Buffer.from(hash);

    return left.length === right.length && timingSafeEqual(left, right);
  }

  private sign(payload: JwtPayload): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = encodeJson(header);
    const encodedPayload = encodeJson(payload);
    const signature = createHmac('sha256', this.secret).update(`${encodedHeader}.${encodedPayload}`).digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
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
