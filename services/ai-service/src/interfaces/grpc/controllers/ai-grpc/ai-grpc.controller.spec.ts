import { AiGrpcController } from './ai-grpc.controller';
import { VkRelationStatus } from '../../../../search-query/domain/models/vk-search-filters';

describe('AiGrpcController', () => {
  it('passes user id and command to use case', async () => {
    const execute = jest.fn().mockResolvedValue({
      status: 'PARSED',
      message: '',
      criteria: {
        id: 'criteria-1',
        rawQuery: 'Ищу девушку из МГУ',
        parsedAt: new Date('2026-05-20T00:00:00.000Z'),
        vkFilters: {
          query: 'ищу девушку из мгу',
          relation: VkRelationStatus.VK_RELATION_STATUS_SINGLE,
          onlineOnly: false,
        },
      },
    });
    const controller = new AiGrpcController({ execute } as never);

    await controller.parseSearchQuery({
      userId: { value: 'user-1' },
      query: 'Ищу девушку из МГУ',
    } as never);

    expect(execute).toHaveBeenCalledWith('user-1', { query: 'Ищу девушку из МГУ' });
  });
});
