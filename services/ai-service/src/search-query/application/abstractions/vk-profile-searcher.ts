import type { VkSearchFilters } from '../../domain/models/vk-search-filters';
import type { SearchPageRequest, SearchPeopleResultProfile } from '../contracts/search-people.result';

export abstract class VkProfileSearcher {
  abstract search(input: {
    accessToken: string;
    filters: VkSearchFilters;
    page: SearchPageRequest;
  }): Promise<{
    profiles: SearchPeopleResultProfile[];
    totalCount: number;
    nextPageToken: string;
  }>;
}
