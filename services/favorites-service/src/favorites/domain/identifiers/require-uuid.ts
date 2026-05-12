import { missingRequiredField } from '@findnmeet/utils';
import type { Uuid } from '@findnmeet/ts-types/shared/v1';

export function requireUuid(value: Uuid | undefined, fieldName: string): Uuid {
  if (!value?.value) {
    throw missingRequiredField(fieldName);
  }

  return value;
}
