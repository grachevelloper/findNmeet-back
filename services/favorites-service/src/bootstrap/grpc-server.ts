import { NestFactory } from '@nestjs/core';
import { HttpExceptionRpcFilter } from '@findnmeet/utils';

import { AppModule } from '../app.module';
import { favoritesGrpcOptions } from './favorites-grpc.options';

export async function bootstrapGrpcServer() {
  const app = await NestFactory.createMicroservice(AppModule, favoritesGrpcOptions());

  app.useGlobalFilters(new HttpExceptionRpcFilter());

  await app.listen();
}
