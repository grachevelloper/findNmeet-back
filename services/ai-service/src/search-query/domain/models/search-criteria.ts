import { VkSearchFilters } from './vk-search-filters';

export interface SearchCriteria {
  id: string;
  rawQuery: string;
  vkFilters: VkSearchFilters;
  parsedAt: Date;
}
