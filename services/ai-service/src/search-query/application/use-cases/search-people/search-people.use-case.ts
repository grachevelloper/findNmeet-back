import { Injectable } from '@nestjs/common';

import { CurrentUserVkAccessTokenProvider } from '../../abstractions/current-user-vk-access-token-provider';
import { VkProfileSearcher } from '../../abstractions/vk-profile-searcher';
import type { SearchPeopleCommand } from '../../contracts/search-people.command';
import type { SearchPeopleResult } from '../../contracts/search-people.result';
import { ParseSearchQueryUseCase } from '../parse-search-query/parse-search-query.use-case';

@Injectable()
export class SearchPeopleUseCase {
  constructor(
    private readonly parseSearchQueryUseCase: ParseSearchQueryUseCase,
    private readonly vkAccessTokens: CurrentUserVkAccessTokenProvider,
    private readonly vkProfileSearch: VkProfileSearcher,
  ) {}

  async execute(command: SearchPeopleCommand): Promise<SearchPeopleResult> {
    const parsedQuery = await this.parseSearchQueryUseCase.execute(command.userId, {
      query: command.query,
    });

    if (parsedQuery.status === 'NEEDS_CLARIFICATION') {
      return {
        aiCriteriaId: parsedQuery.criteria.id,
        aiStatus: 'BASELINE',
        profiles: [],
        totalCount: 0,
        nextPageToken: '',
      };
    }

    const accessToken = await this.vkAccessTokens.getByUserId(command.userId);
    const searchResult = await this.vkProfileSearch.search({
      accessToken,
      filters: parsedQuery.criteria.vkFilters,
      page: command.page,
    });

    return {
      aiCriteriaId: parsedQuery.criteria.id,
      aiStatus: 'ENRICHED',
      profiles: searchResult.profiles,
      totalCount: searchResult.totalCount,
      nextPageToken: searchResult.nextPageToken,
    };
  }
}
