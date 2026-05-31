import { ParseSearchQueryUseCase } from './parse-search-query.use-case';
import { VkRelationStatus } from '../../../domain/models/vk-search-filters';

describe('ParseSearchQueryUseCase', () => {
  it('returns NEEDS_CLARIFICATION for blank query without calling parser', async () => {
    const parser = { parse: jest.fn() };
    const useCase = new ParseSearchQueryUseCase(parser as never);

    const result = await useCase.execute('user-1', { query: '   ' });

    expect(parser.parse).not.toHaveBeenCalled();
    expect(result.status).toBe('NEEDS_CLARIFICATION');
    expect(result.message).toContain('Сформулируй запрос подробнее');
    expect(result.criteria.rawQuery).toBe('');
    expect(result.criteria.vkFilters).toEqual({
      query: '',
      relation: VkRelationStatus.VK_RELATION_STATUS_UNSPECIFIED,
      onlineOnly: false,
    });
  });

  it('returns PARSED for meaningful query and delegates to parser', async () => {
    const parser = {
      parse: jest.fn().mockResolvedValue({
        query: 'ищу девушку из мгу',
        university: { id: 1n, title: 'МГУ' },
        relation: VkRelationStatus.VK_RELATION_STATUS_SINGLE,
        onlineOnly: false,
      }),
    };
    const useCase = new ParseSearchQueryUseCase(parser as never);

    const result = await useCase.execute('user-1', { query: 'Ищу девушку из МГУ' });

    expect(parser.parse).toHaveBeenCalledWith('user-1', 'Ищу девушку из МГУ');
    expect(result.status).toBe('PARSED');
    expect(result.message).toBe('');
    expect(result.criteria.rawQuery).toBe('Ищу девушку из МГУ');
    expect(result.criteria.vkFilters.university?.title).toBe('МГУ');
  });

  it('falls back to raw query filters when parser is unavailable', async () => {
    const parser = {
      parse: jest.fn().mockRejectedValue(new Error('network failed')),
    };
    const useCase = new ParseSearchQueryUseCase(parser as never);

    const result = await useCase.execute('user-1', { query: 'Парень из Тулы' });

    expect(parser.parse).toHaveBeenCalledWith('user-1', 'Парень из Тулы');
    expect(result.status).toBe('PARSED');
    expect(result.criteria.rawQuery).toBe('Парень из Тулы');
    expect(result.criteria.vkFilters).toEqual({
      query: 'Парень из Тулы',
      relation: VkRelationStatus.VK_RELATION_STATUS_UNSPECIFIED,
      onlineOnly: false,
    });
  });
});
