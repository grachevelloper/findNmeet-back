import type { IssuedSession } from '../dto/issued-session.dto';

export abstract class SessionTokenManager {
  abstract issue(userId: string, now?: Date, roles?: string[]): IssuedSession;
  abstract refreshExpiresAt(now?: Date): Date;
  abstract hashRefreshToken(refreshToken: string): string;
  abstract equalsRefreshHash(refreshToken: string, hash: string): boolean;
}
