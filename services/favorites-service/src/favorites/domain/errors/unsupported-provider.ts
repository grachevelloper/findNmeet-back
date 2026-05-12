import { BadRequestException } from '@nestjs/common';

import { errorResponse } from './error-response';

export function unsupportedProvider(): BadRequestException {
  return new BadRequestException(errorResponse('unsupported_provider', 'Only VK favorites are supported'));
}
