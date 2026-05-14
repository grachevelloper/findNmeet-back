import { NestFactory } from '@nestjs/core';
import { HttpExceptionRpcFilter } from '@findnmeet/utils';

import { AppModule } from '../app.module';
import { authGrpcOptions } from './auth-grpc.options';

export async function bootstrapGrpcServer() {
  const app = await NestFactory.createMicroservice(AppModule, authGrpcOptions());

  app.useGlobalFilters(new HttpExceptionRpcFilter());

  await app.listen();
}
