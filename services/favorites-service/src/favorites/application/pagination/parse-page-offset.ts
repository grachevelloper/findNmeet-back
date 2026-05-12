import { invalidPageToken } from '../../domain/errors/invalid-page-token';

export function parsePageOffset(pageToken: string | undefined): number {
  if (!pageToken) {
    return 0;
  }

  const offset = Number(pageToken);

  if (!Number.isInteger(offset) || offset < 0) {
    throw invalidPageToken();
  }

  return offset;
}
