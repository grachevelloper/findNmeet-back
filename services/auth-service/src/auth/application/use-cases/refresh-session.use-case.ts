import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';

import type { RefreshSessionCommand } from '../commands/refresh-session.command';
import type { RefreshSessionResult } from '../dto/refresh-session.result';
import { invalidRefreshToken } from '../errors/auth.errors';
import { SessionTokenManager } from '../ports/session-token-manager';
import { AuthUnitOfWork } from '../ports/auth-unit-of-work';
import { AuthSessionRepository } from '../../domain/ports/auth-session.repository';
import { UserRepository } from '../../domain/ports/user.repository';
import { UserStatus } from '../../domain/models/user-status';

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly authSessions: AuthSessionRepository,
    private readonly users: UserRepository,
    private readonly unitOfWork: AuthUnitOfWork,
    private readonly sessionTokenManager: SessionTokenManager,
  ) {}

  async execute(command: RefreshSessionCommand): Promise<RefreshSessionResult> {
    if (!command.refreshToken) {
      throw invalidRefreshToken();
    }

    const refreshTokenHash = this.sessionTokenManager.hashRefreshToken(command.refreshToken);
    const existing = await this.authSessions.findByRefreshTokenHash(refreshTokenHash);
    const now = new Date();

    if (!existing || existing.revokedAt || existing.expiresAt <= now) {
      throw invalidRefreshToken();
    }

    const user = await this.users.findById(existing.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw invalidRefreshToken();
    }

    const session = this.sessionTokenManager.issue(user.id, now);

    await this.unitOfWork.runInTransaction(async () => {
      await this.authSessions.save({
        ...existing,
        revokedAt: now,
        updatedAt: now,
      });

      await this.authSessions.save({
        id: randomUUID(),
        userId: user.id,
        refreshTokenHash: this.sessionTokenManager.hashRefreshToken(session.refreshToken),
        expiresAt: this.sessionTokenManager.refreshExpiresAt(now),
        createdAt: now,
        updatedAt: now,
        revokedAt: null,
      });

      await this.users.save({
        ...user,
        lastActiveAt: now,
        updatedAt: now,
      });
    });

    return { session };
  }
}
