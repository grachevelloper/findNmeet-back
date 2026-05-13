import { join } from 'path';
import { protoPath as healthCheckProtoPath } from 'grpc-health-check';
import { Transport } from '@nestjs/microservices';
import type { GrpcOptions } from '@nestjs/microservices';
import { registerGrpcHealthCheck } from '@findnmeet/utils';

export function favoritesGrpcOptions(): GrpcOptions {
  return {
    transport: Transport.GRPC,
    options: {
      package: 'findnmeet.favorites.v1',
      protoPath: [healthCheckProtoPath, join(process.cwd(), 'contracts/proto/findnmeet/favorites/v1/service.proto')],
      url: process.env.FAVORITES_SERVICE_GRPC_URL ?? '0.0.0.0:50053',
      loader: {
        includeDirs: [join(process.cwd(), 'contracts/proto')],
      },
      onLoadPackageDefinition: (_packageDefinition, server) =>
        registerGrpcHealthCheck(server, 'findnmeet.favorites.v1.FavoritesService'),
    },
  };
}
