import { BadRequestException } from '@nestjs/common';

export function parsePageSize(pageSize?: string): number | undefined {
  if (!pageSize) {
    return undefined;
  }

  const nextValue = Number(pageSize);
  if (!Number.isInteger(nextValue) || nextValue <= 0) {
    throw new BadRequestException('page_size must be a positive integer');
  }

  return nextValue;
}
