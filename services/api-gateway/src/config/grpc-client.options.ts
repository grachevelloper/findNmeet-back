import { join } from 'path';
import { Transport } from '@nestjs/microservices';
import type { ClientsProviderAsyncOptions, GrpcOptions } from '@nestjs/microservices';

import { gatewayConfig } from './gateway.config';

type GrpcClientConfig = {
  packageName: string;
  protoRelativePath: string;
  url: string;
};

export function authGrpcClientOptions(): ClientsProviderAsyncOptions {
  const config = gatewayConfig();
  return grpcClientOptions('AUTH_GRPC_CLIENT', {
    packageName: 'findnmeet.auth.v1',
    protoRelativePath: 'findnmeet/auth/v1/service.proto',
    url: config.authServiceGrpcUrl,
  });
}

export function favoritesGrpcClientOptions(): ClientsProviderAsyncOptions {
  const config = gatewayConfig();
  return grpcClientOptions('FAVORITES_GRPC_CLIENT', {
    packageName: 'findnmeet.favorites.v1',
    protoRelativePath: 'findnmeet/favorites/v1/service.proto',
    url: config.favoritesServiceGrpcUrl,
  });
}

function grpcClientOptions(name: string, config: GrpcClientConfig): ClientsProviderAsyncOptions {
  const protoRoot = join(__dirname, '../../../../contracts/proto');

  return {
    name,
    useFactory: (): GrpcOptions => ({
      transport: Transport.GRPC,
      options: {
        package: config.packageName,
        protoPath: join(protoRoot, config.protoRelativePath),
        url: config.url,
        loader: {
          includeDirs: [protoRoot],
        },
      },
    }),
  };
}
