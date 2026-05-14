import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { create } from '@bufbuild/protobuf';

import { AuthResult } from '@findnmeet/ts-types/auth/v1';
import { ExchangeOAuthCodeRequestSchema } from '@findnmeet/ts-types/vk/v1';

import { disabledUser, invalidRefreshToken, missingRequiredField, userNotFound } from './errors/auth.errors';
import { toDomainExternalLink, toDomainUser } from './mappers/auth-domain.mapper';
import { Provider } from '../domain/models/provider';
import type { UserExternalLink } from '../domain/models/user-external-link';
import { UserStatus } from '../domain/models/user-status';
import type { AuthenticatedUserResult, CompleteVkOAuthResult, RefreshSessionResult } from './contracts/auth.results';
import { AuthSessionEntity } from '../infrastructure/persistence/auth-session.entity';
import { AuthTokenEntity } from '../infrastructure/persistence/auth-token.entity';
import { UserEntity } from '../infrastructure/persistence/user.entity';
import { UserExternalLinkEntity } from '../infrastructure/persistence/user-external-link.entity';
import { SessionTokens } from '../infrastructure/security/session-tokens';
import { TokenCrypto } from '../infrastructure/security/token-crypto';
import { VkGatewayClient } from '../infrastructure/vk/vk-gateway.client';

@Injectable()
export class AuthApplicationService {
  constructor(
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(UserExternalLinkEntity) private readonly externalLinks: Repository<UserExternalLinkEntity>,
    @InjectRepository(AuthTokenEntity) private readonly authTokens: Repository<AuthTokenEntity>,
    @InjectRepository(AuthSessionEntity) private readonly authSessions: Repository<AuthSessionEntity>,
    private readonly sessionTokens: SessionTokens,
    private readonly tokenCrypto: TokenCrypto,
    private readonly vkGatewayClient: VkGatewayClient,
  ) {}

  async completeVkOAuth(command: {
    code?: string;
    state?: string;
    redirectUri?: string;
    codeVerifier?: string;
  }): Promise<CompleteVkOAuthResult> {
    if (!command.code) {
      throw missingRequiredField('code');
    }
    if (!command.redirectUri) {
      throw missingRequiredField('redirect_uri');
    }

    const vkResponse = await this.vkGatewayClient.exchangeOAuthCode(create(ExchangeOAuthCodeRequestSchema, {
      code: command.code,
      redirectUri: command.redirectUri,
      codeVerifier: command.codeVerifier ?? '',
    }));
    const now = new Date();
    const externalId = vkResponse.externalId;
    const existingLink = await this.externalLinks.findOneBy({ provider: Provider.VK, externalId });
    let result = AuthResult.AUTHENTICATED_EXISTING_USER;

    const user = await this.users.manager.transaction(async (entityManager) => {
      const users = entityManager.getRepository(UserEntity);
      const externalLinks = entityManager.getRepository(UserExternalLinkEntity);
      const authTokens = entityManager.getRepository(AuthTokenEntity);

      let link = existingLink;
      let user: UserEntity;

      if (link) {
        user = await users.findOneByOrFail({ id: link.userId });
        link.providerMeta = { screenName: vkResponse.profile?.screenName ?? '' };
        link.updatedAt = now;
        await externalLinks.save(link);
      } else {
        user = users.create({
          id: randomUUID(),
          createdAt: now,
          updatedAt: now,
          lastActiveAt: now,
          status: UserStatus.ACTIVE,
        });
        await users.save(user);
        link = externalLinks.create({
          id: randomUUID(),
          userId: user.id,
          provider: Provider.VK,
          externalId,
          providerMeta: { screenName: vkResponse.profile?.screenName ?? '' },
          linkedAt: now,
          updatedAt: now,
        });
        await externalLinks.save(link);
        result = AuthResult.CREATED_USER;
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw disabledUser();
      }

      user.lastActiveAt = now;
      user.updatedAt = now;
      await users.save(user);

      const expiresAt = new Date(now.getTime() + Number(vkResponse.tokens?.expiresIn?.seconds ?? 0) * 1000);
      const existingToken = await authTokens.findOneBy({ externalLinkId: link.id });
      const authToken = authTokens.create({
        id: existingToken?.id ?? randomUUID(),
        externalLinkId: link.id,
        accessTokenCiphertext: this.tokenCrypto.encrypt(vkResponse.tokens?.accessToken?.value ?? ''),
        refreshTokenCiphertext: this.tokenCrypto.encrypt(vkResponse.tokens?.refreshToken?.value ?? ''),
        encryptionKeyId: this.tokenCrypto.keyId,
        expiresAt,
        createdAt: existingToken?.createdAt ?? now,
        updatedAt: now,
        lastUsedAt: now,
        revokedAt: null,
      });
      await authTokens.save(authToken);

      return user;
    });

    const session = await this.createSession(user.id, now);
    const externalLinks = await this.externalLinks.findBy({ userId: user.id });

    return {
      user: toDomainUser(user),
      externalLinks: externalLinks.map(toDomainExternalLink),
      session,
      result,
    };
  }

  async getUser(userId?: string): Promise<AuthenticatedUserResult> {
    if (!userId) {
      throw missingRequiredField('user_id');
    }

    const user = await this.users.findOneBy({ id: userId });
    if (!user) {
      throw userNotFound();
    }

    const externalLinks = await this.externalLinks.findBy({ userId });
    return {
      user: toDomainUser(user),
      externalLinks: externalLinks.map(toDomainExternalLink),
    };
  }

  async getExternalLinks(userId?: string): Promise<UserExternalLink[]> {
    if (!userId) {
      throw missingRequiredField('user_id');
    }

    const externalLinks = await this.externalLinks.findBy({ userId });
    return externalLinks.map(toDomainExternalLink);
  }

  async refreshSession(refreshToken?: string): Promise<RefreshSessionResult> {
    if (!refreshToken) {
      throw invalidRefreshToken();
    }

    const refreshTokenHash = this.sessionTokens.hashRefreshToken(refreshToken);
    const existing = await this.authSessions.findOneBy({ refreshTokenHash });
    const now = new Date();

    if (!existing || existing.revokedAt || existing.expiresAt <= now) {
      throw invalidRefreshToken();
    }

    const user = await this.users.findOneBy({ id: existing.userId });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw invalidRefreshToken();
    }

    existing.revokedAt = now;
    existing.updatedAt = now;
    await this.authSessions.save(existing);

    const session = await this.createSession(user.id, now);
    user.lastActiveAt = now;
    user.updatedAt = now;
    await this.users.save(user);

    return { session };
  }

  async revokeSession(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    const existing = await this.authSessions.findOneBy({ refreshTokenHash: this.sessionTokens.hashRefreshToken(refreshToken) });
    if (!existing || existing.revokedAt) {
      return;
    }

    existing.revokedAt = new Date();
    existing.updatedAt = existing.revokedAt;
    await this.authSessions.save(existing);
  }

  private async createSession(userId: string, now = new Date()) {
    const session = this.sessionTokens.issue(userId, now);
    const entity = this.authSessions.create({
      id: randomUUID(),
      userId,
      refreshTokenHash: this.sessionTokens.hashRefreshToken(session.refreshToken),
      expiresAt: this.sessionTokens.refreshExpiresAt(now),
      createdAt: now,
      updatedAt: now,
      revokedAt: null,
    });

    await this.authSessions.save(entity);

    return session;
  }
}
