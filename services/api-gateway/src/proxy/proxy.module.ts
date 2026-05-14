import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { AuthModule } from '../auth/auth.module';
import { authGrpcClientOptions, favoritesGrpcClientOptions } from '../config/grpc-client.options';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  imports: [AuthModule, ClientsModule.registerAsync([authGrpcClientOptions(), favoritesGrpcClientOptions()])],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
