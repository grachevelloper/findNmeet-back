import { Injectable, UnauthorizedException } from '@nestjs/common';

import type { GetVkAccessTokenQuery } from '../queries/get-vk-access-token.query';
import { missingRequiredField } from '../errors/auth.errors';
import { AuthTokenRepository } from '../../domain/ports/auth-token.repository';
import { ExternalLinkRepository } from '../../domain/ports/external-link.repository';
import { Provider } from '../../domain/models/provider';

@Injectable()
export class GetVkAccessTokenUseCase {
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
      throw new UnauthorizedException('VK account is not linked');
    }

    const token = await this.authTokens.findByExternalLinkId(vkLink.id);
    if (!token || token.revokedAt || token.expiresAt.getTime() <= Date.now() || !token.accessToken) {
      throw new UnauthorizedException('VK access token is unavailable');
    }

    return { accessToken: token.accessToken };
  }
}
