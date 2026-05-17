import { AiRepository } from '../../domain/ports/ai.repository';
import { ParseSearchQuery } from '../contracts/ai.commands';
import { SearchCriteria } from '../../domain/models/search-criteria';
import { randomUUID } from 'node:crypto';

export class ParseSearchQueryUseCase {
  constructor(private readonly aiRepository: AiRepository) {}

  async execute(ownerId: string, query: ParseSearchQuery): Promise<SearchCriteria> {
    const vkFilters = await this.aiRepository.parseSearchQuery(ownerId, query.query);

    return {
      id: randomUUID(),
      rawQuery: query.query,
      vkFilters,
      parsedAt: new Date(),
    };
  }
}
