import type { User } from '../../domain/models/user';
import type { UserExternalLink } from '../../domain/models/user-external-link';
import type { UserExternalLinkEntity } from '../../infrastructure/persistence/user-external-link.entity';
import type { UserEntity } from '../../infrastructure/persistence/user.entity';

export function toDomainUser(entity: UserEntity): User {
  return {
    id: entity.id,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    lastActiveAt: entity.lastActiveAt,
    status: entity.status,
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
