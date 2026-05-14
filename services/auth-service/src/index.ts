import 'reflect-metadata';
import { bootstrapGrpcServer } from './bootstrap/grpc-server';

async function bootstrap() {
  await bootstrapGrpcServer();
  console.log('auth-service gRPC transport is listening');
}

bootstrap();
