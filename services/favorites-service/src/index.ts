import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { favoritesGrpcOptions } from './grpc/config/favorites-grpc.options';
import { HttpExceptionRpcFilter } from './grpc/filters/http-exception-rpc.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, favoritesGrpcOptions());

  app.useGlobalFilters(new HttpExceptionRpcFilter());

  await app.listen();
  console.log('favorites-service gRPC transport is listening');
}

bootstrap();
