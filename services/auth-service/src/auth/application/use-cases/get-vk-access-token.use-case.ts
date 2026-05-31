import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import type { GetVkAccessTokenQuery } from '../queries/get-vk-access-token.query';
import { missingRequiredField } from '../errors/auth.errors';
import { AuthTokenRepository } from '../../domain/ports/auth-token.repository';
import { ExternalLinkRepository } from '../../domain/ports/external-link.repository';
import { Provider } from '../../domain/models/provider';

@Injectable()
export class GetVkAccessTokenUseCase {
  private readonly logger = new Logger(GetVkAccessTokenUseCase.name);

  constructor(
    private readonly externalLinks: ExternalLinkRepository,
    private readonly authTokens: AuthTokenRepository,
  ) {}

  async execute(query: GetVkAccessTokenQuery): Promise<{ accessToken: string }> {
    if (!query.userId) {
      throw missingRequiredField('user_id');
    }

    const externalLinks = await this.externalLinks.findByUserId(query.userId);
    const vkLink = externalLinks.find((link) => link.provider === Provider.VK);
    if (!vkLink) {
      this.logUnavailable('vk_link_not_found', { userId: query.userId });
      throw new UnauthorizedException('VK account is not linked');
    }

    const token = await this.authTokens.findByExternalLinkId(vkLink.id);
    if (!token) {
      this.logUnavailable('token_not_found', { userId: query.userId, externalLinkId: vkLink.id });
      throw new UnauthorizedException('VK access token is unavailable');
    }
    if (token.revokedAt) {
      this.logUnavailable('token_revoked', {
        userId: query.userId,
        externalLinkId: vkLink.id,
        revokedAt: token.revokedAt.toISOString(),
      });
      throw new UnauthorizedException('VK access token is unavailable');
    }
    if (token.expiresAt.getTime() <= Date.now()) {
      this.logUnavailable('token_expired', {
        userId: query.userId,
        externalLinkId: vkLink.id,
        expiresAt: token.expiresAt.toISOString(),
      });
      throw new UnauthorizedException('VK access token is unavailable');
    }
    if (!token.accessToken) {
      this.logUnavailable('token_empty', { userId: query.userId, externalLinkId: vkLink.id });
      throw new UnauthorizedException('VK access token is unavailable');
    }

    return { accessToken: token.accessToken };
  }

  private logUnavailable(reason: string, details: Record<string, string>): void {
    this.logger.warn(JSON.stringify({
      event: 'vk_access_token_unavailable',
      reason,
      ...details,
    }));
  }
}
