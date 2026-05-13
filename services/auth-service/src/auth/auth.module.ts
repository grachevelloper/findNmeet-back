import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthApplicationService } from './application/auth.service';
import { AuthSessionEntity } from './infrastructure/persistence/auth-session.entity';
import { AuthTokenEntity } from './infrastructure/persistence/auth-token.entity';
import { UserExternalLinkEntity } from './infrastructure/persistence/user-external-link.entity';
import { UserEntity } from './infrastructure/persistence/user.entity';
import { SessionTokens } from './infrastructure/security/session-tokens';
import { TokenCrypto } from './infrastructure/security/token-crypto';
import { VkGatewayClient } from './infrastructure/vk/vk-gateway.client';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserExternalLinkEntity, AuthTokenEntity, AuthSessionEntity])],
  providers: [AuthApplicationService, SessionTokens, TokenCrypto, VkGatewayClient],
  exports: [AuthApplicationService],
})
export class AuthModule {}
