import { ServiceHealthResponse } from '@findnmeet/types';

export function buildHealthResponse(service: string): ServiceHealthResponse {
  return { status: 'ok', service };
}
