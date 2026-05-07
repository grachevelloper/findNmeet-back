export interface ServiceHealthResponse {
  status: 'ok';
  service: string;
}

export * from './shared/v1';
export * from './vk/v1';
export * from './auth/v1';
export * from './search/v1';
export * from './favorites/v1';
export * from './ai/v1';
