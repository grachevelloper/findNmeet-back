import 'reflect-metadata';
import { bootstrapGrpcServer } from './bootstrap/grpc-server';

async function bootstrap() {
  await bootstrapGrpcServer();
  console.log('favorites-service gRPC transport is listening');
}

bootstrap();