import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
// import { HttpExceptionRpcFilter } from '../interfaces/grpc/filters/http-exception-rpc.filter';
import { AiGrpcOptions } from './ai-grpc.options';

export async function bootstrapGrpcServer() {
  const app = await NestFactory.createMicroservice(AppModule, AiGrpcOptions());

//   app.useGlobalFilters(new HttpExceptionRpcFilter());

  await app.listen();
}
