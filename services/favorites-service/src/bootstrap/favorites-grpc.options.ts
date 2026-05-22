import { join } from 'path';
import { protoPath as healthCheckProtoPath } from 'grpc-health-check';
import { Transport } from '@nestjs/microservices';
import type { GrpcOptions } from '@nestjs/microservices';

import { registerGrpcHealthCheck } from './register-grpc-health-check';

export function favoritesGrpcOptions(): GrpcOptions {
  const contractsProtoRoot = join(__dirname, '../../../../contracts/proto');

  return {
    transport: Transport.GRPC,
    options: {
      package: 'findnmeet.favorites.v1',
      protoPath: [healthCheckProtoPath, join(contractsProtoRoot, 'findnmeet/favorites/v1/service.proto')],
      url: process.env.FAVORITES_SERVICE_GRPC_URL ?? '0.0.0.0:50053',
      loader: {
        includeDirs: [contractsProtoRoot],
      },
      onLoadPackageDefinition: (_packageDefinition, server) =>
        registerGrpcHealthCheck(server, 'findnmeet.favorites.v1.FavoritesService'),
    },
  };
}
