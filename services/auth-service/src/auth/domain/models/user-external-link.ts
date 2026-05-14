import { Provider } from './provider';

export type UserExternalLink = {
  id: string;
  userId: string;
  provider: Provider;
  externalId: string;
  providerMeta?: {
    screenName?: string;
  };
  linkedAt: Date;
  updatedAt: Date;
};
