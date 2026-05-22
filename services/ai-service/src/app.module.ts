import { Module } from '@nestjs/common';
import { AiSearchQueryParser } from './search-query/application/abstractions/ai-search-query-parser';
import { ParseSearchQueryUseCase } from './search-query/application/use-cases/parse-search-query/parse-search-query.use-case';
import { getGoogleAiConfig } from './search-query/infrastracture/ai/google-ai.config';
import { SearchQueryParser } from './search-query/infrastracture/ai/search-query-parser';
import { AiGrpcController } from './interfaces/grpc/controllers/ai-grpc/ai-grpc.controller';

@Module({
  controllers: [AiGrpcController],
  providers: [
    ParseSearchQueryUseCase,
    {
      provide: AiSearchQueryParser,
      useFactory: () => new SearchQueryParser(getGoogleAiConfig(process.env)),
    },
  ],
})
export class AppModule {}
