import { BadRequestException } from '@nestjs/common';

import { errorResponse } from './error-response';

export function unsupportedUpdateMask(): BadRequestException {
  return new BadRequestException(errorResponse('unsupported_update_mask', 'Only note can be updated'));
}
