import { BadRequestException, UnauthorizedException } from '@nestjs/common';

export function missingUserContext(): UnauthorizedException {
  return new UnauthorizedException(errorResponse('missing_user_context', 'X-User-Id header is required'));
}

export function missingRequiredField(fieldName: string): BadRequestException {
  return new BadRequestException(errorResponse('missing_required_field', `${fieldName} is required`));
}

export function invalidExternalId(fieldName: string): BadRequestException {
  return new BadRequestException(errorResponse('invalid_external_id', `${fieldName} must be a VK numeric id`));
}

function errorResponse(code: string, message: string) {
  return { error: { code, message } };
}
