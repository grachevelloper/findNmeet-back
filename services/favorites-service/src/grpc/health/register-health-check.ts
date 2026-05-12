import { HealthImplementation } from 'grpc-health-check';

export function registerHealthCheck(server: unknown): void {
  const health = new HealthImplementation({
    '': 'SERVING',
    'findnmeet.favorites.v1.FavoritesService': 'SERVING',
  });

  health.addToServer(server as Parameters<HealthImplementation['addToServer']>[0]);
}
