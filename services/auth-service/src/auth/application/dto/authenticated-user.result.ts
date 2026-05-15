import type { UserExternalLink } from '../../domain/models/user-external-link';
import type { User } from '../../domain/models/user';

export type AuthenticatedUserResult = {
  user: User;
  externalLinks: UserExternalLink[];
};
