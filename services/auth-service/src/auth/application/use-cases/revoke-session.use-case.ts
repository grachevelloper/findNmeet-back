import { Injectable } from '@nestjs/common';

import type { RevokeSessionCommand } from '../commands/revoke-session.command';
import { SessionTokenManager } from '../ports/session-token-manager';
import { AuthSessionRepository } from '../../domain/ports/auth-session.repository';

@Injectable()
export class RevokeSessionUseCase {
  constructor(
    private readonly authSessions: AuthSessionRepository,
    private readonly sessionTokenManager: SessionTokenManager,
  ) {}

  async execute(command: RevokeSessionCommand): Promise<void> {
    if (!command.refreshToken) {
      return;
    }

    const existing = await this.authSessions.findByRefreshTokenHash(
      this.sessionTokenManager.hashRefreshToken(command.refreshToken),
    );

    if (!existing || existing.revokedAt) {
      return;
    }

    const now = new Date();
    await this.authSessions.save({
      ...existing,
      revokedAt: now,
      updatedAt: now,
    });
  }
}
