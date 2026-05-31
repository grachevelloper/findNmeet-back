import type { GatewayRoute } from '../config/gateway.config';

export function sanitizeProxyResult(route: GatewayRoute, result: unknown): unknown {
  const sanitized = sanitizeJsonValue(result);

  if (!route.writeSessionCookies || !sanitized || typeof sanitized !== 'object' || !('session' in sanitized)) {
    return sanitized;
  }

  const response = sanitized as Record<string, unknown>;
  const session = response.session;
  if (!session || typeof session !== 'object') {
    return sanitized;
  }

  return {
    ...response,
    session: {
      expiresAt: (session as Record<string, unknown>).expiresAt,
    },
  };
}

function sanitizeJsonValue(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeJsonValue);
  }

  if (!value || typeof value !== 'object' || value instanceof Date) {
    return value;
  }

  if (isLongLike(value)) {
    return longLikeToString(value);
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [key, sanitizeJsonValue(nestedValue)]),
  );
}

function isLongLike(value: object): value is { low: number; high: number; unsigned: boolean } {
  const candidate = value as { low?: unknown; high?: unknown; unsigned?: unknown };
  return (
    typeof candidate.low === 'number' &&
    typeof candidate.high === 'number' &&
    typeof candidate.unsigned === 'boolean' &&
    Object.keys(candidate).length === 3
  );
}

function longLikeToString(value: { low: number; high: number; unsigned: boolean }): string {
  const low = BigInt(value.low >>> 0);
  const high = BigInt(value.high);
  const unsignedValue = (high << 32n) + low;

  if (value.unsigned || value.high >= 0) {
    return unsignedValue.toString();
  }

  return (unsignedValue - (1n << 64n)).toString();
}
