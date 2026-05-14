import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';

export function missingRequiredField(fieldName: string): BadRequestException {
  return new BadRequestException(errorResponse('missing_required_field', `${fieldName} is required`));
}

export function invalidRefreshToken(): UnauthorizedException {
  return new UnauthorizedException(errorResponse('invalid_refresh_token', 'Refresh token is invalid or expired'));
}

export function userNotFound(): NotFoundException {
  return new NotFoundException(errorResponse('user_not_found', 'User was not found'));
}

export function disabledUser(): UnauthorizedException {
  return new UnauthorizedException(errorResponse('disabled_user', 'User is disabled'));
}

function errorResponse(code: string, message: string) {
  return { error: { code, message } };
}
