import { join } from 'path';
import { protoPath as healthCheckProtoPath } from 'grpc-health-check';
import { Transport } from '@nestjs/microservices';
import type { GrpcOptions } from '@nestjs/microservices';
import { registerGrpcHealthCheck } from '@findnmeet/utils';

export function authGrpcOptions(): GrpcOptions {
  return {
    transport: Transport.GRPC,
    options: {
      package: 'findnmeet.auth.v1',
      protoPath: [healthCheckProtoPath, join(process.cwd(), 'contracts/proto/findnmeet/auth/v1/service.proto')],
      url: process.env.AUTH_SERVICE_GRPC_URL ?? '0.0.0.0:50051',
      loader: {
        includeDirs: [join(process.cwd(), 'contracts/proto')],
      },
      onLoadPackageDefinition: (_packageDefinition, server) => registerGrpcHealthCheck(server, 'findnmeet.auth.v1.AuthService'),
    },
  };
}
