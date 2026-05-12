import { NotFoundException } from '@nestjs/common';

import { errorResponse } from './error-response';

export function favoriteNotFound(): NotFoundException {
  return new NotFoundException(errorResponse('favorite_not_found', 'Favorite not found'));
}
