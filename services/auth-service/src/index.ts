import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { authGrpcOptions } from './interfaces/grpc/config/auth-grpc.options';
import { HttpExceptionRpcFilter } from './interfaces/grpc/filters/http-exception-rpc.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, authGrpcOptions());

  app.useGlobalFilters(new HttpExceptionRpcFilter());

  await app.listen();
  console.log('auth-service gRPC transport is listening');
}

bootstrap();
