import { join } from 'path';
import { protoPath as healthCheckProtoPath } from 'grpc-health-check';
import { Transport } from '@nestjs/microservices';
import type { GrpcOptions } from '@nestjs/microservices';

import { registerGrpcHealthCheck } from './register-grpc-health-check';

export function AiGrpcOptions(): GrpcOptions {
  const contractsProtoRoot = join(__dirname, '../../../../contracts/proto');

  return {
    transport: Transport.GRPC,
    options: {
      package: ['findnmeet.ai.v1', 'findnmeet.search.v1'],
      protoPath: [
        healthCheckProtoPath,
        join(contractsProtoRoot, 'findnmeet/ai/v1/service.proto'),
        join(contractsProtoRoot, 'findnmeet/search/v1/service.proto'),
      ],
      url: process.env.AI_SERVICE_GRPC_URL ?? '0.0.0.0:50053',
      loader: {
        includeDirs: [contractsProtoRoot],
      },
      onLoadPackageDefinition: (_packageDefinition, server) =>
        registerGrpcHealthCheck(server, [
          'findnmeet.ai.v1.AiService',
          'findnmeet.search.v1.SearchOrchestratorService',
        ]),
    },
  };
}
