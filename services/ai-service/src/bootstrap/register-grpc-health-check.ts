import { HealthImplementation } from 'grpc-health-check';

export function registerGrpcHealthCheck(server: unknown, serviceNames: string[]): void {
  const statuses = Object.fromEntries(serviceNames.map((serviceName) => [serviceName, 'SERVING']));
  const health = new HealthImplementation({
    '': 'SERVING',
    ...statuses,
  });

  health.addToServer(server as Parameters<HealthImplementation['addToServer']>[0]);
}
