import { BadRequestException } from '@nestjs/common';

export function normalizeExternalId(input: { external_id?: string; vk_user_id?: string }): string {
  const value = input.external_id ?? input.vk_user_id;
  if (!value) {
    throw new BadRequestException('external_id or vk_user_id is required');
  }

  return value;
}
