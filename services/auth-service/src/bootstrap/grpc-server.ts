import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { HttpExceptionRpcFilter } from '../interfaces/grpc/filters/http-exception-rpc.filter';
import { authGrpcOptions } from './auth-grpc.options';

export async function bootstrapGrpcServer() {
  const app = await NestFactory.createMicroservice(AppModule, authGrpcOptions());

  app.useGlobalFilters(new HttpExceptionRpcFilter());

  await app.listen();
}
