import type { AuthResult } from '@findnmeet/ts-types/auth/v1';

import type { AuthSession } from '../../domain/models/auth-session';
import type { UserExternalLinkEntity } from '../../infrastructure/persistence/user-external-link.entity';
import type { UserEntity } from '../../infrastructure/persistence/user.entity';

export type CompleteVkOAuthResult = {
  user: UserEntity;
  externalLinks: UserExternalLinkEntity[];
  session: AuthSession;
  result: AuthResult;
};

export type RefreshSessionResult = {
  session: AuthSession;
};

export type AuthenticatedUserResult = {
  user: UserEntity;
  externalLinks: UserExternalLinkEntity[];
};
