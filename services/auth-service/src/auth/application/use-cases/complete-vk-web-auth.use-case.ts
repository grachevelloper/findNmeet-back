import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { create } from '@bufbuild/protobuf';

import { AuthResult } from '@findnmeet/ts-types/auth/v1';
import { GetCurrentProfileRequestSchema } from '@findnmeet/ts-types/vk/v1';
import { SensitiveStringSchema } from '@findnmeet/ts-types/shared/v1';

import type { CompleteVkWebAuthCommand } from '../commands/complete-vk-web-auth.command';
import type { CompleteVkOAuthResult } from '../dto/complete-vk-oauth.result';
import { disabledUser, missingRequiredField } from '../errors/auth.errors';
import { AuthUnitOfWork } from '../ports/auth-unit-of-work';
import { SessionTokenManager } from '../ports/session-token-manager';
import { TokenCipher } from '../ports/token-cipher';
import { VkOAuthProvider } from '../ports/vk-oauth-provider';
import { AuthSessionRepository } from '../../domain/ports/auth-session.repository';
import { AuthTokenRepository } from '../../domain/ports/auth-token.repository';
import { ExternalLinkRepository } from '../../domain/ports/external-link.repository';
import { UserRepository } from '../../domain/ports/user.repository';
import { Provider } from '../../domain/models/provider';
import { UserStatus } from '../../domain/models/user-status';

@Injectable()
export class CompleteVkWebAuthUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly externalLinks: ExternalLinkRepository,
    private readonly authSessions: AuthSessionRepository,
    private readonly authTokens: AuthTokenRepository,
    private readonly unitOfWork: AuthUnitOfWork,
    private readonly sessionTokenManager: SessionTokenManager,
    private readonly tokenCipher: TokenCipher,
    private readonly vkOAuthProvider: VkOAuthProvider,
  ) {}

  async execute(command: CompleteVkWebAuthCommand): Promise<CompleteVkOAuthResult> {
    if (!command.accessToken) {
      throw missingRequiredField('access_token');
    }
    const accessToken = command.accessToken;

    const profileResponse = await this.vkOAuthProvider.getCurrentProfile(create(GetCurrentProfileRequestSchema, {
      accessToken: create(SensitiveStringSchema, { value: accessToken }),
    }));

    const profile = profileResponse.profile;
    if (!profile?.vkUserId) {
      throw missingRequiredField('vk_profile.vk_user_id');
    }

    const now = new Date();
    const externalId = String(profile.vkUserId);
    let result = AuthResult.AUTHENTICATED_EXISTING_USER;

    const user = await this.unitOfWork.runInTransaction(async () => {
      let link = await this.externalLinks.findByProviderAndExternalId(Provider.VK, externalId);
      let user = link ? await this.users.findById(link.userId) : null;

      if (link && !user) {
        throw disabledUser();
      }

      if (!link || !user) {
        user = await this.users.save({
          id: randomUUID(),
          createdAt: now,
          updatedAt: now,
          lastActiveAt: now,
          status: UserStatus.ACTIVE,
        });

        link = await this.externalLinks.save({
          id: randomUUID(),
          userId: user.id,
          provider: Provider.VK,
          externalId,
          providerMeta: { screenName: profile.screenName ?? '' },
          linkedAt: now,
          updatedAt: now,
        });

        result = AuthResult.CREATED_USER;
      } else {
        link = await this.externalLinks.save({
          ...link,
          providerMeta: { screenName: profile.screenName ?? '' },
          updatedAt: now,
        });
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw disabledUser();
      }

      user = await this.users.save({
        ...user,
        lastActiveAt: now,
        updatedAt: now,
      });

      return user;
    });

    const session = this.sessionTokenManager.issue(user.id, now);
    await this.unitOfWork.runInTransaction(async () => {
      await this.authSessions.save({
        id: randomUUID(),
        userId: user.id,
        refreshTokenHash: this.sessionTokenManager.hashRefreshToken(session.refreshToken),
        expiresAt: this.sessionTokenManager.refreshExpiresAt(now),
        createdAt: now,
        updatedAt: now,
        revokedAt: null,
      });
    });

    const externalLinks = await this.externalLinks.findByUserId(user.id);

    return {
      user,
      externalLinks,
      session,
      result,
    };
  }
}
