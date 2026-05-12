import { invalidExternalId, missingRequiredField } from '@findnmeet/utils';

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
