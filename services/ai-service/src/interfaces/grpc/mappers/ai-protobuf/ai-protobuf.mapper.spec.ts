import { ParseSearchQueryStatus } from '@findnmeet/ts-types/ai/v1';

import { parseSearchQueryResponseToProto } from './ai-protobuf.mapper';
import { VkRelationStatus } from '../../../../search-query/domain/models/vk-search-filters';

describe('parseSearchQueryResponseToProto', () => {
  it('maps NEEDS_CLARIFICATION result into protobuf response', () => {
    const response = parseSearchQueryResponseToProto({
      status: 'NEEDS_CLARIFICATION',
      message:
        'Сформулируй запрос подробнее: укажи, кого ищешь и, если знаешь, добавь город, вуз, возраст или другие детали.',
      criteria: {
        id: 'criteria-1',
        rawQuery: '',
        parsedAt: new Date('2026-05-20T00:00:00.000Z'),
        vkFilters: {
          query: '',
          relation: VkRelationStatus.VK_RELATION_STATUS_UNSPECIFIED,
          onlineOnly: false,
        },
      },
    });

    expect(response.status).toBe(ParseSearchQueryStatus.NEEDS_CLARIFICATION);
    expect(response.message).toContain('Сформулируй запрос подробнее');
    expect(response.criteria?.rawQuery).toBe('');
  });
});
