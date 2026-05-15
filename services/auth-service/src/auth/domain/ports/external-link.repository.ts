import type { UserExternalLink } from '../models/user-external-link';

export abstract class ExternalLinkRepository {
  abstract findByProviderAndExternalId(provider: number, externalId: string): Promise<UserExternalLink | null>;
  abstract findByUserId(userId: string): Promise<UserExternalLink[]>;
  abstract save(link: UserExternalLink): Promise<UserExternalLink>;
}
