import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function corsOptions(): CorsOptions {
  const configuredOrigins = (process.env.API_GATEWAY_CORS_ORIGINS ?? process.env.API_GATEWAY_FRONTEND_URL ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredOrigins.length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API_GATEWAY_CORS_ORIGINS or API_GATEWAY_FRONTEND_URL is required in production');
    }

    return {
      origin: ['http://localhost:5173', 'https://localhost:5173', 'http://localhost:3000', 'https://localhost:3000'],
      credentials: true,
    };
  }

  return {
    origin: configuredOrigins,
    credentials: true,
  };
}
