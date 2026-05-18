import type { AuthSession } from '../../../domain/models/auth-session';
import type { AuthToken } from '../../../domain/models/auth-token';
import type { UserExternalLink } from '../../../domain/models/user-external-link';
import type { User } from '../../../domain/models/user';
import type { UserExternalLinkEntity } from '../user-external-link.entity';
import type { UserEntity } from '../user.entity';
import type { AuthSessionEntity } from '../auth-session.entity';
import type { AuthTokenEntity } from '../auth-token.entity';

export function toDomainUser(entity: UserEntity): User {
  return {
    id: entity.id,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    lastActiveAt: entity.lastActiveAt,
    status: entity.status,
  };
}

export function toUserEntity(user: User): UserEntity {
  return {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastActiveAt: user.lastActiveAt,
    status: user.status,
  };
}

export function toDomainExternalLink(entity: UserExternalLinkEntity): UserExternalLink {
  const screenName = typeof entity.providerMeta?.screenName === 'string' ? entity.providerMeta.screenName : undefined;

  return {
    id: entity.id,
    userId: entity.userId,
    provider: entity.provider,
    externalId: entity.externalId,
    providerMeta: screenName ? { screenName } : undefined,
    linkedAt: entity.linkedAt,
    updatedAt: entity.updatedAt,
  };
}

export function toExternalLinkEntity(link: UserExternalLink): UserExternalLinkEntity {
  return {
    id: link.id,
    userId: link.userId,
    provider: link.provider,
    externalId: link.externalId,
    providerMeta: link.providerMeta ? { screenName: link.providerMeta.screenName ?? '' } : null,
    linkedAt: link.linkedAt,
    updatedAt: link.updatedAt,
  };
}

export function toDomainAuthSession(entity: AuthSessionEntity): AuthSession {
  return {
    id: entity.id,
    userId: entity.userId,
    refreshTokenHash: entity.refreshTokenHash,
    expiresAt: entity.expiresAt,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    revokedAt: entity.revokedAt,
  };
}

export function toAuthSessionEntity(session: AuthSession): AuthSessionEntity {
  return {
    id: session.id,
    userId: session.userId,
    refreshTokenHash: session.refreshTokenHash,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    revokedAt: session.revokedAt,
  };
}

export function toDomainAuthToken(
  entity: AuthTokenEntity,
  decrypt: (value: string) => string,
): AuthToken {
  return {
    id: entity.id,
    externalLinkId: entity.externalLinkId,
    accessToken: decrypt(entity.accessTokenCiphertext),
    refreshToken: decrypt(entity.refreshTokenCiphertext),
    deviceId: entity.deviceId,
    encryptionKeyId: entity.encryptionKeyId,
    expiresAt: entity.expiresAt,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    lastUsedAt: entity.lastUsedAt,
    revokedAt: entity.revokedAt,
  };
}

export function toAuthTokenEntity(
  token: AuthToken,
  encrypt: (value: string) => string,
): AuthTokenEntity {
  return {
    id: token.id,
    externalLinkId: token.externalLinkId,
    accessTokenCiphertext: encrypt(token.accessToken),
    refreshTokenCiphertext: encrypt(token.refreshToken),
    deviceId: token.deviceId,
    encryptionKeyId: token.encryptionKeyId,
    expiresAt: token.expiresAt,
    createdAt: token.createdAt,
    updatedAt: token.updatedAt,
    lastUsedAt: token.lastUsedAt,
    revokedAt: token.revokedAt,
  };
}
