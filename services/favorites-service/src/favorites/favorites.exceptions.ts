import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';

export function missingUserContext(): UnauthorizedException {
  return new UnauthorizedException(errorResponse('missing_user_context', 'X-User-Id header is required'));
}

export function missingRequiredField(fieldName: string): BadRequestException {
  return new BadRequestException(errorResponse('missing_required_field', `${fieldName} is required`));
}

export function invalidExternalId(fieldName: string): BadRequestException {
  return new BadRequestException(errorResponse('invalid_external_id', `${fieldName} must be a VK numeric id`));
}

export function invalidPageToken(): BadRequestException {
  return new BadRequestException(errorResponse('invalid_page_token', 'page_token must be a non-negative integer offset'));
}

export function invalidPageSize(): BadRequestException {
  return new BadRequestException(errorResponse('invalid_page_size', 'page_size must be an integer'));
}

export function invalidProvider(): BadRequestException {
  return new BadRequestException(errorResponse('invalid_provider', 'provider must be VK'));
}

export function unsupportedProvider(): BadRequestException {
  return new BadRequestException(errorResponse('unsupported_provider', 'Only VK favorites are supported'));
}

export function unsupportedUpdateMask(): BadRequestException {
  return new BadRequestException(errorResponse('unsupported_update_mask', 'Only note can be updated'));
}

export function favoriteExists(): ConflictException {
  return new ConflictException(errorResponse('favorite_exists', 'Favorite already exists'));
}

export function favoriteNotFound(): NotFoundException {
  return new NotFoundException(errorResponse('favorite_not_found', 'Favorite not found'));
}

function errorResponse(code: string, message: string) {
  return {
    error: {
      code,
      message,
    },
  };
}
