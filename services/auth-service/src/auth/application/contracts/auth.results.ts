import type { AuthResult } from '@findnmeet/ts-types/auth/v1';

import type { AuthSession } from '../../domain/models/auth-session';
import type { UserExternalLink } from '../../domain/models/user-external-link';
import type { User } from '../../domain/models/user';

export type CompleteVkOAuthResult = {
  user: User;
  externalLinks: UserExternalLink[];
  session: AuthSession;
  result: AuthResult;
};

export type RefreshSessionResult = {
  session: AuthSession;
};

export type AuthenticatedUserResult = {
  user: User;
  externalLinks: UserExternalLink[];
};
