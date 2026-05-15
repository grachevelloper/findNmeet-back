import { existsSync, readFileSync } from 'fs';
import type { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';

export function httpsOptions(): HttpsOptions | undefined {
  const keyPath = process.env.API_GATEWAY_TLS_KEY_PATH;
  const certPath = process.env.API_GATEWAY_TLS_CERT_PATH;

  if (!keyPath || !certPath) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API_GATEWAY_TLS_KEY_PATH and API_GATEWAY_TLS_CERT_PATH are required in production');
    }

    return undefined;
  }

  if (!existsSync(keyPath) || !existsSync(certPath)) {
    throw new Error('Configured TLS certificate files were not found');
  }

  return {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath),
  };
}
