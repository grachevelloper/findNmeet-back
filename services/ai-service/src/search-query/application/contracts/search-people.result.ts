export type SearchPageRequest = {
  pageSize: number;
  pageToken: string;
};

export type SearchReference = {
  id: bigint;
  title: string;
};

export type SearchPeopleResultProfile = {
  vkUserId: number;
  firstName: string;
  lastName: string;
  screenName: string;
  photoUrl: string;
  city?: SearchReference;
  country?: SearchReference;
  homeTown?: string;
  university?: SearchReference;
  faculty?: SearchReference;
  graduationYear?: number;
  bdateRaw?: string;
  age?: number;
  onlineStatus: 'UNSPECIFIED' | 'ONLINE' | 'OFFLINE';
  lastSeenAt?: Date;
  relation:
    | 'UNSPECIFIED'
    | 'UNKNOWN'
    | 'NOT_SPECIFIED'
    | 'SINGLE'
    | 'RELATIONSHIP'
    | 'ENGAGED'
    | 'MARRIED'
    | 'COMPLICATED'
    | 'SEARCHING'
    | 'IN_LOVE'
    | 'CIVIL_UNION';
  visibility: 'UNSPECIFIED' | 'OPEN' | 'CLOSED';
  privateMessageStatus: 'UNSPECIFIED' | 'UNKNOWN' | 'ALLOWED' | 'DENIED';
};

export type SearchPeopleResult = {
  aiCriteriaId: string;
  aiStatus: 'BASELINE' | 'ENRICHED';
  profiles: SearchPeopleResultProfile[];
  totalCount: number;
  nextPageToken: string;
};
