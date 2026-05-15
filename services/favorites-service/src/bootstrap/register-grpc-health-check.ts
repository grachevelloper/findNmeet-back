import { HealthImplementation } from 'grpc-health-check';

export function registerGrpcHealthCheck(server: unknown, serviceName: string): void {
  const health = new HealthImplementation({
    '': 'SERVING',
    [serviceName]: 'SERVING',
  });

  health.addToServer(server as Parameters<HealthImplementation['addToServer']>[0]);
}
