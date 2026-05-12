import { create } from '@bufbuild/protobuf';
import { UuidSchema } from '@findnmeet/ts-types/shared/v1';
import type { Uuid } from '@findnmeet/ts-types/shared/v1';

export function createUuid(value: string): Uuid {
  return create(UuidSchema, { value });
}
