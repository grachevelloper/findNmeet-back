import { ConflictException } from '@nestjs/common';

import { errorResponse } from './error-response';

export function favoriteExists(): ConflictException {
  return new ConflictException(errorResponse('favorite_exists', 'Favorite already exists'));
}
