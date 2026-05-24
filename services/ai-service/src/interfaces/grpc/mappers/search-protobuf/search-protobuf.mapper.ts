import { create } from '@bufbuild/protobuf';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import {
  AiSearchStatus,
  SearchPeopleResponseSchema,
  SearchResultSchema,
  type SearchPeopleRequest,
  type SearchPeopleResponse,
} from '@findnmeet/ts-types/search/v1';
import { PageResponseSchema, UuidSchema } from '@findnmeet/ts-types/shared/v1';
import {
  VkOnlineStatus,
  VkPrivateMessageStatus,
  VkProfileSchema,
  VkProfileVisibility,
  VkReferenceSchema,
  VkRelationStatus,
} from '@findnmeet/ts-types/vk/v1';

import type { SearchPeopleCommand } from '../../../../search-query/application/contracts/search-people.command';
import type { SearchPeopleResult, SearchPeopleResultProfile } from '../../../../search-query/application/contracts/search-people.result';

export function searchPeopleRequestFromProto(request: SearchPeopleRequest): SearchPeopleCommand {
  return {
    userId: request.userId?.value ?? '',
    query: request.query,
    page: {
      pageSize: request.page?.pageSize ?? 20,
      pageToken: request.page?.pageToken ?? '',
    },
  };
}

export function searchPeopleResponseToProto(result: SearchPeopleResult): SearchPeopleResponse {
  return create(SearchPeopleResponseSchema, {
    result: create(SearchResultSchema, {
      profiles: result.profiles.map(profileToProto),
      totalCount: BigInt(result.totalCount),
      aiCriteriaId: create(UuidSchema, { value: result.aiCriteriaId }),
      aiStatus: result.aiStatus === 'ENRICHED' ? AiSearchStatus.ENRICHED : AiSearchStatus.BASELINE,
      page: create(PageResponseSchema, { nextPageToken: result.nextPageToken }),
    }),
  });
}

function profileToProto(profile: SearchPeopleResultProfile) {
  return create(VkProfileSchema, {
    vkUserId: BigInt(profile.vkUserId),
    firstName: profile.firstName,
    lastName: profile.lastName,
    screenName: profile.screenName,
    photoUrl: profile.photoUrl,
    city: profile.city ? referenceToProto(profile.city) : undefined,
    country: profile.country ? referenceToProto(profile.country) : undefined,
    homeTown: profile.homeTown,
    university: profile.university ? referenceToProto(profile.university) : undefined,
    faculty: profile.faculty ? referenceToProto(profile.faculty) : undefined,
    graduationYear: profile.graduationYear,
    bdateRaw: profile.bdateRaw,
    age: profile.age,
    onlineStatus: onlineStatusToProto(profile.onlineStatus),
    lastSeenAt: profile.lastSeenAt ? timestampFromDate(profile.lastSeenAt) : undefined,
    relation: relationToProto(profile.relation),
    visibility: visibilityToProto(profile.visibility),
    privateMessageStatus: privateMessageStatusToProto(profile.privateMessageStatus),
  });
}

function referenceToProto(reference: { id: bigint; title: string }) {
  return create(VkReferenceSchema, {
    id: reference.id,
    title: reference.title,
  });
}

function onlineStatusToProto(status: SearchPeopleResultProfile['onlineStatus']) {
  switch (status) {
    case 'ONLINE':
      return VkOnlineStatus.ONLINE;
    case 'OFFLINE':
      return VkOnlineStatus.OFFLINE;
    default:
      return VkOnlineStatus.UNSPECIFIED;
  }
}

function relationToProto(status: SearchPeopleResultProfile['relation']) {
  switch (status) {
    case 'UNKNOWN':
      return VkRelationStatus.UNKNOWN;
    case 'NOT_SPECIFIED':
      return VkRelationStatus.NOT_SPECIFIED;
    case 'SINGLE':
      return VkRelationStatus.SINGLE;
    case 'RELATIONSHIP':
      return VkRelationStatus.RELATIONSHIP;
    case 'ENGAGED':
      return VkRelationStatus.ENGAGED;
    case 'MARRIED':
      return VkRelationStatus.MARRIED;
    case 'COMPLICATED':
      return VkRelationStatus.COMPLICATED;
    case 'SEARCHING':
      return VkRelationStatus.SEARCHING;
    case 'IN_LOVE':
      return VkRelationStatus.IN_LOVE;
    case 'CIVIL_UNION':
      return VkRelationStatus.CIVIL_UNION;
    default:
      return VkRelationStatus.UNSPECIFIED;
  }
}

function visibilityToProto(status: SearchPeopleResultProfile['visibility']) {
  switch (status) {
    case 'OPEN':
      return VkProfileVisibility.OPEN;
    case 'CLOSED':
      return VkProfileVisibility.CLOSED;
    default:
      return VkProfileVisibility.UNSPECIFIED;
  }
}

function privateMessageStatusToProto(status: SearchPeopleResultProfile['privateMessageStatus']) {
  switch (status) {
    case 'UNKNOWN':
      return VkPrivateMessageStatus.UNKNOWN;
    case 'ALLOWED':
      return VkPrivateMessageStatus.ALLOWED;
    case 'DENIED':
      return VkPrivateMessageStatus.DENIED;
    default:
      return VkPrivateMessageStatus.UNSPECIFIED;
  }
}
