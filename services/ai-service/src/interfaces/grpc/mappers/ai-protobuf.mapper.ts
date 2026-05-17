import { create } from '@bufbuild/protobuf';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import { ParseSearchQueryResponseSchema } from '@findnmeet/ts-types/ai/v1';
import type {
  ParseSearchQueryRequest,
  ParseSearchQueryResponse,
} from '@findnmeet/ts-types/ai/v1';
import {
  SearchCriteriaSchema,
  type SearchCriteria as ProtoSearchCriteria,
} from '@findnmeet/ts-types/search/v1';
import { UuidSchema } from '@findnmeet/ts-types/shared/v1';
import {
  VkReferenceSchema,
  VkRelationStatus,
  VkSearchFiltersSchema,
} from '@findnmeet/ts-types/vk/v1';

import type { ParseSearchQuery } from '../../../search-query/application/contracts/ai.commands';
import type { SearchCriteria } from '../../../search-query/domain/models/search-criteria';
import type {
  VkReference,
  VkSearchFilters,
} from '../../../search-query/domain/models/vk-search-filters';
import { VkRelationStatus as DomainVkRelationStatus } from '../../../search-query/domain/models/vk-search-filters';

export function parseSearchQueryRequestFromProto(
  request: ParseSearchQueryRequest,
): ParseSearchQuery {
  return {
    query: request.query,
  };
}

export function parseSearchQueryResponseToProto(
  criteria: SearchCriteria,
): ParseSearchQueryResponse {
  return create(ParseSearchQueryResponseSchema, {
    criteria: searchCriteriaToProto(criteria),
  });
}

function searchCriteriaToProto(criteria: SearchCriteria): ProtoSearchCriteria {
  return create(SearchCriteriaSchema, {
    id: createUuid(criteria.id),
    rawQuery: criteria.rawQuery,
    vkFilters: vkSearchFiltersToProto(criteria.vkFilters),
    parsedAt: timestampFromDate(criteria.parsedAt),
  });
}

function vkReferenceToProto(vkReference: VkReference) {
  return create(VkReferenceSchema, {
    id: vkReference.id,
    title: vkReference.title,
  });
}

function vkSearchFiltersToProto(vkSearchFilters: VkSearchFilters) {
  return create(VkSearchFiltersSchema, {
    query: vkSearchFilters.query,
    city: vkSearchFilters.city ? vkReferenceToProto(vkSearchFilters.city) : undefined,
    country: vkSearchFilters.country ? vkReferenceToProto(vkSearchFilters.country) : undefined,
    university: vkSearchFilters.university ? vkReferenceToProto(vkSearchFilters.university) : undefined,
    faculty: vkSearchFilters.faculty ? vkReferenceToProto(vkSearchFilters.faculty) : undefined,
    ageFrom: vkSearchFilters.ageFrom,
    ageTo: vkSearchFilters.ageTo,
    graduationYear: vkSearchFilters.graduationYear,
    relation: vkRelationStatusToProto(vkSearchFilters.relation),
    onlineOnly: vkSearchFilters.onlineOnly,
  });
}

function vkRelationStatusToProto(
  relation: DomainVkRelationStatus,
): VkRelationStatus {
  switch (relation) {
    case DomainVkRelationStatus.VK_RELATION_STATUS_UNKNOWN:
      return VkRelationStatus.UNKNOWN;
    case DomainVkRelationStatus.VK_RELATION_STATUS_NOT_SPECIFIED:
      return VkRelationStatus.NOT_SPECIFIED;
    case DomainVkRelationStatus.VK_RELATION_STATUS_SINGLE:
      return VkRelationStatus.SINGLE;
    case DomainVkRelationStatus.VK_RELATION_STATUS_RELATIONSHIP:
      return VkRelationStatus.RELATIONSHIP;
    case DomainVkRelationStatus.VK_RELATION_STATUS_ENGAGED:
      return VkRelationStatus.ENGAGED;
    case DomainVkRelationStatus.VK_RELATION_STATUS_MARRIED:
      return VkRelationStatus.MARRIED;
    case DomainVkRelationStatus.VK_RELATION_STATUS_COMPLICATED:
      return VkRelationStatus.COMPLICATED;
    case DomainVkRelationStatus.VK_RELATION_STATUS_SEARCHING:
      return VkRelationStatus.SEARCHING;
    case DomainVkRelationStatus.VK_RELATION_STATUS_IN_LOVE:
      return VkRelationStatus.IN_LOVE;
    case DomainVkRelationStatus.VK_RELATION_STATUS_CIVIL_UNION:
      return VkRelationStatus.CIVIL_UNION;
    case DomainVkRelationStatus.VK_RELATION_STATUS_UNSPECIFIED:
    default:
      return VkRelationStatus.UNSPECIFIED;
  }
}

function createUuid(value: string) {
  return value ? create(UuidSchema, { value }) : undefined;
}
