import type { AuthResult } from '@findnmeet/ts-types/auth/v1';

import type { UserExternalLink } from '../../domain/models/user-external-link';
import type { User } from '../../domain/models/user';
import type { IssuedSession } from './issued-session.dto';

export type CompleteVkOAuthResult = {
  user: User;
  externalLinks: UserExternalLink[];
  session: IssuedSession;
  result: AuthResult;
};
