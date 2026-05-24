import 'reflect-metadata';
import { bootstrapGrpcServer } from './bootstrap/grpc-server';

async function bootstrap() {
  await bootstrapGrpcServer();
  console.log('ai-service gRPC transport is listening');
}

bootstrap();
