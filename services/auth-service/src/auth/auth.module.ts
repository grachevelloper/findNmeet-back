import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthUnitOfWork } from './application/ports/auth-unit-of-work';
import { SessionTokenManager } from './application/ports/session-token-manager';
import { TokenCipher } from './application/ports/token-cipher';
import { VkOAuthProvider } from './application/ports/vk-oauth-provider';
import { CompleteVkOAuthUseCase } from './application/use-cases/complete-vk-oauth.use-case';
import { GetExternalLinksUseCase } from './application/use-cases/get-external-links.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { RevokeSessionUseCase } from './application/use-cases/revoke-session.use-case';
import { AuthSessionRepository } from './domain/ports/auth-session.repository';
import { AuthTokenRepository } from './domain/ports/auth-token.repository';
import { ExternalLinkRepository } from './domain/ports/external-link.repository';
import { UserRepository } from './domain/ports/user.repository';
import { AuthSessionEntity } from './infrastructure/persistence/auth-session.entity';
import { AuthTokenEntity } from './infrastructure/persistence/auth-token.entity';
import { TypeOrmAuthSessionRepository } from './infrastructure/persistence/typeorm-auth-session.repository';
import { TypeOrmAuthTokenRepository } from './infrastructure/persistence/typeorm-auth-token.repository';
import { TypeOrmAuthUnitOfWork } from './infrastructure/persistence/typeorm-auth.unit-of-work';
import { TypeOrmExternalLinkRepository } from './infrastructure/persistence/typeorm-external-link.repository';
import { TypeOrmManagerContext } from './infrastructure/persistence/typeorm-manager.context';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { UserExternalLinkEntity } from './infrastructure/persistence/user-external-link.entity';
import { UserEntity } from './infrastructure/persistence/user.entity';
import { SessionTokens } from './infrastructure/security/session-tokens';
import { TokenCrypto } from './infrastructure/security/token-crypto';
import { VkGatewayClient } from './infrastructure/vk/vk-gateway.client';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserExternalLinkEntity, AuthTokenEntity, AuthSessionEntity])],
  providers: [
    CompleteVkOAuthUseCase,
    GetUserUseCase,
    GetExternalLinksUseCase,
    RefreshSessionUseCase,
    RevokeSessionUseCase,
    TypeOrmManagerContext,
    TypeOrmUserRepository,
    TypeOrmExternalLinkRepository,
    TypeOrmAuthTokenRepository,
    TypeOrmAuthSessionRepository,
    TypeOrmAuthUnitOfWork,
    SessionTokens,
    TokenCrypto,
    VkGatewayClient,
    { provide: UserRepository, useExisting: TypeOrmUserRepository },
    { provide: ExternalLinkRepository, useExisting: TypeOrmExternalLinkRepository },
    { provide: AuthTokenRepository, useExisting: TypeOrmAuthTokenRepository },
    { provide: AuthSessionRepository, useExisting: TypeOrmAuthSessionRepository },
    { provide: AuthUnitOfWork, useExisting: TypeOrmAuthUnitOfWork },
    { provide: SessionTokenManager, useExisting: SessionTokens },
    { provide: TokenCipher, useExisting: TokenCrypto },
    { provide: VkOAuthProvider, useExisting: VkGatewayClient },
  ],
  exports: [
    CompleteVkOAuthUseCase,
    GetUserUseCase,
    GetExternalLinksUseCase,
    RefreshSessionUseCase,
    RevokeSessionUseCase,
  ],
})
export class AuthModule {}
