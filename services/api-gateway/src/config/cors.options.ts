import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function corsOptions(): CorsOptions {
  const configuredOrigins = (process.env.API_GATEWAY_CORS_ORIGINS ?? process.env.API_GATEWAY_FRONTEND_URL ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredOrigins.length === 0) {
    return { origin: true, credentials: true };
  }

  return {
    origin: configuredOrigins,
    credentials: true,
  };
}
