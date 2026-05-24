import { SearchGrpcController } from './search-grpc.controller';

describe('SearchGrpcController', () => {
  it('passes command to search use case', async () => {
    const execute = jest.fn().mockResolvedValue({
      aiCriteriaId: 'criteria-1',
      aiStatus: 'ENRICHED',
      totalCount: 1,
      nextPageToken: '20',
      profiles: [],
    });
    const controller = new SearchGrpcController({ execute } as never);

    await controller.searchPeople({
      userId: { value: 'user-1' },
      query: 'Ищу девушку из МГУ',
      page: {
        pageSize: 20,
        pageToken: '',
      },
    } as never);

    expect(execute).toHaveBeenCalledWith({
      userId: 'user-1',
      query: 'Ищу девушку из МГУ',
      page: {
        pageSize: 20,
        pageToken: '',
      },
    });
  });
});
