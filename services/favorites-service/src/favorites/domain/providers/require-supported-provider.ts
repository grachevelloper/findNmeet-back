import { missingRequiredField } from '@findnmeet/utils';
import { Provider } from '@findnmeet/ts-types/shared/v1';

import { unsupportedProvider } from '../errors/unsupported-provider';

export function requireSupportedProvider(provider: Provider): Provider {
  if (provider === Provider.UNSPECIFIED) {
    throw missingRequiredField('provider');
  }

  if (provider !== Provider.VK) {
    throw unsupportedProvider();
  }

  return provider;
}
