import { SearchPeopleRequestSchema, AiSearchStatus } from '@findnmeet/ts-types/search/v1';
import { create } from '@bufbuild/protobuf';
import { timestampDate } from '@bufbuild/protobuf/wkt';

import {
  searchPeopleRequestFromProto,
  searchPeopleResponseToProto,
} from './search-protobuf.mapper';

describe('search-protobuf.mapper', () => {
  it('defaults page arguments when request page is missing', () => {
    const command = searchPeopleRequestFromProto(
      create(SearchPeopleRequestSchema, {
        userId: { value: 'user-1' },
        query: 'Ищу девушку',
      }),
    );

    expect(command).toEqual({
      userId: 'user-1',
      query: 'Ищу девушку',
      page: {
        pageSize: 20,
        pageToken: '',
      },
    });
  });

  it('maps enriched search result into protobuf response', () => {
    const response = searchPeopleResponseToProto({
      aiCriteriaId: 'criteria-1',
      aiStatus: 'ENRICHED',
      totalCount: 1,
      nextPageToken: '20',
      profiles: [
        {
          vkUserId: 7,
          firstName: 'Anna',
          lastName: 'Ivanova',
          screenName: 'anna',
          photoUrl: 'https://example.com/a.jpg',
          city: { id: 1n, title: 'Moscow' },
          onlineStatus: 'ONLINE',
          relation: 'SINGLE',
          visibility: 'OPEN',
          privateMessageStatus: 'ALLOWED',
          lastSeenAt: new Date('2026-05-22T10:00:00.000Z'),
        },
      ],
    });

    expect(response.result?.aiStatus).toBe(AiSearchStatus.ENRICHED);
    expect(response.result?.totalCount).toBe(1n);
    expect(response.result?.page?.nextPageToken).toBe('20');
    expect(response.result?.profiles[0].city?.title).toBe('Moscow');
    expect(response.result?.profiles[0].lastSeenAt && timestampDate(response.result.profiles[0].lastSeenAt).toISOString()).toBe(
      '2026-05-22T10:00:00.000Z',
    );
  });
});
