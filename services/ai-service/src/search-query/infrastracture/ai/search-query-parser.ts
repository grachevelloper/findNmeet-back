import { generateObject } from 'ai';
import { AiSearchQueryParser } from '../../application/abstractions/ai-search-query-parser';
import { VkReference, VkRelationStatus, VkSearchFilters } from '../../domain/models/vk-search-filters';
import { buildSearchQueryPrompt } from './search-query-parser.prompt';
import { AiSearchQuery, aiSearchQuerySchema } from './search-query-parser.schema';
import { createGoogleAiProvider, GoogleAiConfig } from './google-ai.config';

export class SearchQueryParser implements AiSearchQueryParser {
  private readonly provider;

  constructor(private readonly config: GoogleAiConfig) {
    this.provider = createGoogleAiProvider(config);
  }

  async parse(ownerId: string, searchQuery: string): Promise<VkSearchFilters> {
    const { object } = await generateObject({
      model: this.provider(this.config.model),
      schema: aiSearchQuerySchema,
      prompt: buildSearchQueryPrompt({ ownerId, searchQuery }),
    });

    const parsed = aiSearchQuerySchema.safeParse(object);

    if (!parsed.success) {
      throw new Error('Invalid AI search query response');
    }

    return mapAiSearchQuery(parsed.data);
  }
}

function mapAiSearchQuery(input: AiSearchQuery): VkSearchFilters {
  try {
    return {
      query: input.query,
      city: mapReference(input.city),
      country: mapReference(input.country),
      university: mapReference(input.university),
      faculty: mapReference(input.faculty),
      ageFrom: input.ageFrom,
      ageTo: input.ageTo,
      graduationYear: input.graduationYear,
      relation: VkRelationStatus[input.relation],
      onlineOnly: input.onlineOnly,
    };
  } catch {
    throw new Error('Invalid AI search query response');
  }
}

function mapReference(reference?: { id: string; title: string }): VkReference | undefined {
  if (!reference) {
    return undefined;
  }

  return {
    id: BigInt(reference.id),
    title: reference.title,
  };
}
