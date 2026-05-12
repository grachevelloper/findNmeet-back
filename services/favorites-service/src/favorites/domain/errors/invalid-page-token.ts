import { BadRequestException } from '@nestjs/common';

import { errorResponse } from './error-response';

export function invalidPageToken(): BadRequestException {
  return new BadRequestException(errorResponse('invalid_page_token', 'page_token must be a non-negative integer offset'));
}
