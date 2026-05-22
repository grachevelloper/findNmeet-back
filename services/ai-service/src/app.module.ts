import { Module } from '@nestjs/common';
import { AiSearchQueryParser } from './search-query/application/abstractions/ai-search-query-parser';
import { CurrentUserVkAccessTokenProvider } from './search-query/application/abstractions/current-user-vk-access-token-provider';
import { VkProfileSearcher } from './search-query/application/abstractions/vk-profile-searcher';
import { ParseSearchQueryUseCase } from './search-query/application/use-cases/parse-search-query/parse-search-query.use-case';
import { SearchPeopleUseCase } from './search-query/application/use-cases/search-people/search-people.use-case';
import { getGoogleAiConfig } from './search-query/infrastracture/ai/google-ai.config';
import { AuthVkAccessTokenClient } from './search-query/infrastracture/auth/auth-vk-access-token.client';
import { SearchQueryParser } from './search-query/infrastracture/ai/search-query-parser';
import { VkProfileSearchClient } from './search-query/infrastracture/vk/vk-profile-search.client';
import { AiGrpcController } from './interfaces/grpc/controllers/ai-grpc/ai-grpc.controller';
import { SearchGrpcController } from './interfaces/grpc/controllers/search-grpc/search-grpc.controller';

@Module({
  controllers: [AiGrpcController, SearchGrpcController],
  providers: [
    ParseSearchQueryUseCase,
    SearchPeopleUseCase,
    AuthVkAccessTokenClient,
    VkProfileSearchClient,
    {
      provide: AiSearchQueryParser,
      useFactory: () => new SearchQueryParser(getGoogleAiConfig(process.env)),
    },
    {
      provide: CurrentUserVkAccessTokenProvider,
      useExisting: AuthVkAccessTokenClient,
    },
    {
      provide: VkProfileSearcher,
      useExisting: VkProfileSearchClient,
    },
  ],
})
export class AppModule {}
