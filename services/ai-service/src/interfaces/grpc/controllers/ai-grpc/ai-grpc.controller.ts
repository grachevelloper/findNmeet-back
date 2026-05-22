import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {
  ParseSearchQueryRequest,
  ParseSearchQueryResponse,
} from '@findnmeet/ts-types/ai/v1';

import { ParseSearchQueryUseCase } from '../../../../search-query/application/use-cases/parse-search-query/parse-search-query.use-case';
import {
  parseSearchQueryRequestFromProto,
  parseSearchQueryResponseToProto,
} from '../../mappers/ai-protobuf/ai-protobuf.mapper';

@Controller()
export class AiGrpcController {
  constructor(private readonly parseSearchQueryUseCase: ParseSearchQueryUseCase) {}

  @GrpcMethod('AiService', 'ParseSearchQuery')
  async parseSearchQuery(request: ParseSearchQueryRequest): Promise<ParseSearchQueryResponse> {
    const userId = request.userId?.value?.trim();

    if (!userId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'user_id is required',
      });
    }

    const result = await this.parseSearchQueryUseCase.execute(
      userId,
      parseSearchQueryRequestFromProto(request),
    );

    return parseSearchQueryResponseToProto(result);
  }
}
