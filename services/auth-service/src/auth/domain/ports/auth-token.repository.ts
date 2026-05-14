import type { AuthToken } from '../models/auth-token';

export abstract class AuthTokenRepository {
  abstract findByExternalLinkId(externalLinkId: string): Promise<AuthToken | null>;
  abstract save(token: AuthToken): Promise<AuthToken>;
}
