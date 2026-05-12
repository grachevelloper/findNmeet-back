import { getDefaultPageSize, getMaxPageSize } from '@findnmeet/utils';

export function resolvePageSize(pageSize: number | undefined): number {
  if (!pageSize || pageSize < 1) {
    return getDefaultPageSize();
  }

  return Math.min(pageSize, getMaxPageSize());
}
