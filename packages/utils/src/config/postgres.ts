const DEFAULT_POSTGRES_URL = 'postgresql://findnmeet:findnmeet@localhost:5432/findnmeet';

export function getPostgresUrl(env: Record<string, string | undefined> = process.env): string {
  if (env.POSTGRES_URL) {
    return env.POSTGRES_URL;
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('POSTGRES_URL is required in production');
  }

  return DEFAULT_POSTGRES_URL;
}
