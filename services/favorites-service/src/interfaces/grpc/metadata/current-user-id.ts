import { Metadata } from '@grpc/grpc-js';

import { missingUserContext } from '../../../favorites/domain/errors/validation-errors';

export function currentUserId(metadata: Metadata): string {
  const userId = metadata.get('x-user-id')[0];

  if (typeof userId !== 'string' || !userId) {
    throw missingUserContext();
  }

  return userId;
}
