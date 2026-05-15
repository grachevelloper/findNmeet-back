import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { HttpExceptionRpcFilter } from '../interfaces/grpc/filters/http-exception-rpc.filter';
import { favoritesGrpcOptions } from './favorites-grpc.options';

export async function bootstrapGrpcServer() {
  const app = await NestFactory.createMicroservice(AppModule, favoritesGrpcOptions());

  app.useGlobalFilters(new HttpExceptionRpcFilter());

  await app.listen();
}
