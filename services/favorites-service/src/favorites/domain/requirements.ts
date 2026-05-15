import { unsupportedProvider } from './errors/unsupported-provider';
import { invalidExternalId, missingRequiredField } from './errors/validation-errors';
import { FavoriteProvider } from './models/favorite-provider';

export function requireUuid(value: string | undefined, fieldName: string): string {
  if (!value) {
    throw missingRequiredField(fieldName);
  }

  return value;
}

export function requireExternalId(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw missingRequiredField(fieldName);
  }

  if (!/^\d+$/.test(trimmed)) {
    throw invalidExternalId(fieldName);
  }

  return trimmed;
}

export function requireSupportedProvider(provider: FavoriteProvider | undefined): FavoriteProvider {
  if (!provider) {
    throw missingRequiredField('provider');
  }

  if (provider !== FavoriteProvider.VK) {
    throw unsupportedProvider();
  }

  return provider;
}
