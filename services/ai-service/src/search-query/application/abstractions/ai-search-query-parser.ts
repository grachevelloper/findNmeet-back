import { VkSearchFilters } from '../../domain/models/vk-search-filters';

export abstract class AiSearchQueryParser {
  abstract parse(ownerId: string, searchQuery: string): Promise<VkSearchFilters>;
}
