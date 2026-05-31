import { join } from 'path';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AuthModule } from '../auth/auth.module';
import { gatewayConfig } from '../config/gateway.config';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  imports: [
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: 'AUTH_GRPC_CLIENT',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            url: gatewayConfig().authServiceGrpcUrl,
            package: 'findnmeet.auth.v1',
            protoPath: join(contractsProtoRoot(), 'findnmeet/auth/v1/service.proto'),
            loader: {
              includeDirs: [contractsProtoRoot()],
            },
          },
        }),
      },
      {
        name: 'FAVORITES_GRPC_CLIENT',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            url: gatewayConfig().favoritesServiceGrpcUrl,
            package: 'findnmeet.favorites.v1',
            protoPath: join(contractsProtoRoot(), 'findnmeet/favorites/v1/service.proto'),
            loader: {
              includeDirs: [contractsProtoRoot()],
            },
          },
        }),
      },
      {
        name: 'AI_GRPC_CLIENT',
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            url: gatewayConfig().aiServiceGrpcUrl,
            package: 'findnmeet.search.v1',
            protoPath: join(contractsProtoRoot(), 'findnmeet/search/v1/service.proto'),
            loader: {
              includeDirs: [contractsProtoRoot()],
            },
          },
        }),
      },
    ]),
  ],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}

function contractsProtoRoot(): string {
  return join(__dirname, '../../../../contracts/proto');
}
