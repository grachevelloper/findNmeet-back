import type { AuthSession } from '../models/auth-session';

export abstract class AuthSessionRepository {
  abstract findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null>;
  abstract save(session: AuthSession): Promise<AuthSession>;
}
