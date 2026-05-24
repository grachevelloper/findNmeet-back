import { SearchPeopleUseCase } from './search-people.use-case';
import { VkRelationStatus } from '../../../domain/models/vk-search-filters';

describe('SearchPeopleUseCase', () => {
  it('parses query, loads vk token, and searches profiles', async () => {
    const parseSearchQuery = {
      execute: jest.fn().mockResolvedValue({
        status: 'PARSED',
        message: '',
        criteria: {
          id: 'criteria-1',
          rawQuery: 'Ищу девушку из МГУ',
          parsedAt: new Date('2026-05-22T10:00:00.000Z'),
          vkFilters: {
            query: 'ищу девушку из мгу',
            university: { id: 1n, title: 'МГУ' },
            relation: VkRelationStatus.VK_RELATION_STATUS_SINGLE,
            onlineOnly: true,
          },
        },
      }),
    };
    const vkAccessTokens = {
      getByUserId: jest.fn().mockResolvedValue('vk-access-token'),
    };
    const vkProfileSearch = {
      search: jest.fn().mockResolvedValue({
        profiles: [
          {
            vkUserId: 10,
            firstName: 'Анна',
            lastName: 'Иванова',
            screenName: 'anna',
            photoUrl: 'https://example.com/anna.jpg',
            onlineStatus: 'ONLINE',
            relation: 'SINGLE',
            visibility: 'OPEN',
            privateMessageStatus: 'ALLOWED',
          },
        ],
        totalCount: 1,
        nextPageToken: '20',
      }),
    };
    const useCase = new SearchPeopleUseCase(
      parseSearchQuery as never,
      vkAccessTokens as never,
      vkProfileSearch as never,
    );

    const result = await useCase.execute({
      userId: 'user-1',
      query: 'Ищу девушку из МГУ',
      page: { pageSize: 20, pageToken: '' },
    });

    expect(parseSearchQuery.execute).toHaveBeenCalledWith('user-1', {
      query: 'Ищу девушку из МГУ',
    });
    expect(vkAccessTokens.getByUserId).toHaveBeenCalledWith('user-1');
    expect(vkProfileSearch.search).toHaveBeenCalledWith({
      accessToken: 'vk-access-token',
      filters: {
        query: 'ищу девушку из мгу',
        university: { id: 1n, title: 'МГУ' },
        relation: VkRelationStatus.VK_RELATION_STATUS_SINGLE,
        onlineOnly: true,
      },
      page: { pageSize: 20, pageToken: '' },
    });
    expect(result.aiCriteriaId).toBe('criteria-1');
    expect(result.aiStatus).toBe('ENRICHED');
    expect(result.totalCount).toBe(1);
    expect(result.profiles).toHaveLength(1);
    expect(result.nextPageToken).toBe('20');
  });

  it('returns empty baseline result when query needs clarification', async () => {
    const parseSearchQuery = {
      execute: jest.fn().mockResolvedValue({
        status: 'NEEDS_CLARIFICATION',
        message: 'need more details',
        criteria: {
          id: 'criteria-2',
          rawQuery: '',
          parsedAt: new Date('2026-05-22T10:00:00.000Z'),
          vkFilters: {
            query: '',
            relation: VkRelationStatus.VK_RELATION_STATUS_UNSPECIFIED,
            onlineOnly: false,
          },
        },
      }),
    };
    const vkAccessTokens = { getByUserId: jest.fn() };
    const vkProfileSearch = { search: jest.fn() };
    const useCase = new SearchPeopleUseCase(
      parseSearchQuery as never,
      vkAccessTokens as never,
      vkProfileSearch as never,
    );

    const result = await useCase.execute({
      userId: 'user-1',
      query: '   ',
      page: { pageSize: 20, pageToken: '' },
    });

    expect(vkAccessTokens.getByUserId).not.toHaveBeenCalled();
    expect(vkProfileSearch.search).not.toHaveBeenCalled();
    expect(result.aiStatus).toBe('BASELINE');
    expect(result.profiles).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});
