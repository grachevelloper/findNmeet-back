import { generateObject } from 'ai';
import { SearchQueryParser } from './search-query-parser';
import { VkRelationStatus } from '../../domain/models/vk-search-filters';

jest.mock('ai', () => ({
  generateObject: jest.fn(),
}));

describe('SearchQueryParser', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('maps validated AI output into domain filters', async () => {
    (generateObject as jest.Mock).mockResolvedValue({
      object: {
        query: 'ищу девушку из мгу',
        university: { id: '1', title: 'МГУ' },
        relation: 'VK_RELATION_STATUS_SINGLE',
        onlineOnly: false,
      },
    });

    const parser = new SearchQueryParser({ apiKey: 'key', model: 'gemini-2.0-flash' });

    const result = await parser.parse('user-1', 'Ищу девушку из МГУ');

    expect(result).toEqual({
      query: 'ищу девушку из мгу',
      university: { id: 1n, title: 'МГУ' },
      relation: VkRelationStatus.VK_RELATION_STATUS_SINGLE,
      onlineOnly: false,
    });
  });

  it('accepts optional proxy configuration', async () => {
    (generateObject as jest.Mock).mockResolvedValue({
      object: {
        query: 'ищу девушку из мгу',
        relation: 'VK_RELATION_STATUS_UNSPECIFIED',
        onlineOnly: false,
      },
    });

    const parser = new SearchQueryParser({
      apiKey: 'key',
      model: 'gemini-2.0-flash',
      proxyUrl: 'http://proxy.example:8080',
    });

    await expect(parser.parse('user-1', 'Ищу девушку')).resolves.toMatchObject({
      query: 'ищу девушку из мгу',
    });
  });

  it('throws when AI output is invalid', async () => {
    (generateObject as jest.Mock).mockResolvedValue({
      object: { relation: 'BROKEN' },
    });

    const parser = new SearchQueryParser({ apiKey: 'key', model: 'gemini-2.0-flash' });

    await expect(parser.parse('user-1', 'Ищу девушку')).rejects.toThrow(
      'Invalid AI search query response',
    );
  });
});
