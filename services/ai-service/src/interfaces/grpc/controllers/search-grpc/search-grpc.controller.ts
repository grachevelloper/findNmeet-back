import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type { SearchPeopleRequest, SearchPeopleResponse } from '@findnmeet/ts-types/search/v1';

import { SearchPeopleUseCase } from '../../../../search-query/application/use-cases/search-people/search-people.use-case';
import {
  searchPeopleRequestFromProto,
  searchPeopleResponseToProto,
} from '../../mappers/search-protobuf/search-protobuf.mapper';

@Controller()
export class SearchGrpcController {
  constructor(private readonly searchPeopleUseCase: SearchPeopleUseCase) {}

  @GrpcMethod('SearchOrchestratorService', 'SearchPeople')
  async searchPeople(request: SearchPeopleRequest): Promise<SearchPeopleResponse> {
    const userId = request.userId?.value?.trim();
    if (!userId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'user_id is required',
      });
    }

    const result = await this.searchPeopleUseCase.execute(searchPeopleRequestFromProto(request));
    return searchPeopleResponseToProto(result);
  }
}
