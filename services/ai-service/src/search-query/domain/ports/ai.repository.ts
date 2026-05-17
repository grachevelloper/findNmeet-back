import { VkSearchFilters } from '../models/vk-search-filters';

export abstract class AiRepository {
  abstract parseSearchQuery(ownerId: string, searchQuery: string): Promise<VkSearchFilters>;
}
