import { AiSearchQueryParser } from '../../abstractions/ai-search-query-parser';
import { ParseSearchQuery } from '../../contracts/ai.commands';
import { randomUUID } from 'node:crypto';
import { ParsedSearchQueryResult } from '../../contracts/parsed-search-query.result';
import { VkRelationStatus } from '../../../domain/models/vk-search-filters';

const CLARIFICATION_MESSAGE =
  'Сформулируй запрос подробнее: укажи, кого ищешь и, если знаешь, добавь город, вуз, возраст или другие детали.';

function isWeakPrompt(query: string): boolean {
  if (!query) {
    return true;
  }

  return /^[\p{P}\p{S}\s]+$/u.test(query);
}

export class ParseSearchQueryUseCase {
  constructor(private readonly aiSearchQueryParser: AiSearchQueryParser) {}

  async execute(ownerId: string, query: ParseSearchQuery): Promise<ParsedSearchQueryResult> {
    const normalizedQuery = query.query.trim();

    if (isWeakPrompt(normalizedQuery)) {
      return {
        status: 'NEEDS_CLARIFICATION',
        message: CLARIFICATION_MESSAGE,
        criteria: {
          id: randomUUID(),
          rawQuery: normalizedQuery,
          parsedAt: new Date(),
          vkFilters: {
            query: normalizedQuery,
            relation: VkRelationStatus.VK_RELATION_STATUS_UNSPECIFIED,
            onlineOnly: false,
          },
        },
      };
    }

    const vkFilters = await this.aiSearchQueryParser.parse(ownerId, query.query);

    return {
      status: 'PARSED',
      message: '',
      criteria: {
        id: randomUUID(),
        rawQuery: query.query,
        vkFilters,
        parsedAt: new Date(),
      },
    };
  }
}
