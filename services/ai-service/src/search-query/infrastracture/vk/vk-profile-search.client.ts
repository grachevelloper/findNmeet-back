import { create } from '@bufbuild/protobuf';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom, Observable } from 'rxjs';

import type {
  SearchProfilesRequest,
  SearchProfilesResponse,
  VkProfile,
  VkReference,
} from '@findnmeet/ts-types/vk/v1';
import {
  SearchProfilesRequestSchema,
  VkOnlineStatus,
  VkPrivateMessageStatus,
  VkProfileSchema,
  VkProfileVisibility,
  VkReferenceSchema,
  VkRelationStatus,
  VkSearchFiltersSchema,
} from '@findnmeet/ts-types/vk/v1';
import { PageRequestSchema, SensitiveStringSchema } from '@findnmeet/ts-types/shared/v1';

import { VkProfileSearcher } from '../../application/abstractions/vk-profile-searcher';
import type { SearchPeopleResultProfile } from '../../application/contracts/search-people.result';

type VkGatewayGrpcService = {
  searchProfiles(request: SearchProfilesRequest): Observable<SearchProfilesResponse>;
};

@Injectable()
export class VkProfileSearchClient extends VkProfileSearcher implements OnModuleInit {
  private service!: VkGatewayGrpcService;
  private readonly client: ClientGrpc;

  constructor() {
    super();
    this.client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'findnmeet.vk.v1',
        protoPath: join(process.cwd(), 'contracts/proto/findnmeet/vk/v1/service.proto'),
        url: process.env.VK_GATEWAY_GRPC_URL ?? '127.0.0.1:50054',
        loader: {
          includeDirs: [join(process.cwd(), 'contracts/proto')],
        },
      },
    }) as ClientGrpc;
  }

  onModuleInit(): void {
    this.service = this.client.getService<VkGatewayGrpcService>('VkGatewayService');
  }

  async search(input: {
    accessToken: string;
    filters: import('../../domain/models/vk-search-filters').VkSearchFilters;
    page: import('../../application/contracts/search-people.result').SearchPageRequest;
  }): Promise<{
    profiles: SearchPeopleResultProfile[];
    totalCount: number;
    nextPageToken: string;
  }> {
    const response = await firstValueFrom(
      this.service.searchProfiles(
        create(SearchProfilesRequestSchema, {
          filters: create(VkSearchFiltersSchema, {
            query: input.filters.query,
            city: input.filters.city ? referenceToProto(input.filters.city) : undefined,
            country: input.filters.country ? referenceToProto(input.filters.country) : undefined,
            university: input.filters.university ? referenceToProto(input.filters.university) : undefined,
            faculty: input.filters.faculty ? referenceToProto(input.filters.faculty) : undefined,
            ageFrom: input.filters.ageFrom,
            ageTo: input.filters.ageTo,
            graduationYear: input.filters.graduationYear,
            relation: vkRelationStatusToProto(input.filters.relation),
            onlineOnly: input.filters.onlineOnly,
          }),
          page: create(PageRequestSchema, {
            pageSize: input.page.pageSize,
            pageToken: input.page.pageToken,
          }),
          accessToken: create(SensitiveStringSchema, {
            value: input.accessToken,
          }),
        }),
      ),
    );

    return {
      profiles: (response.result?.profiles ?? []).map(profileFromProto),
      totalCount: Number(response.result?.totalCount ?? 0),
      nextPageToken: response.page?.nextPageToken ?? '',
    };
  }
}

function referenceToProto(reference: { id: bigint; title: string }) {
  return create(VkReferenceSchema, {
    id: reference.id,
    title: reference.title,
  });
}

function profileFromProto(profile: VkProfile): SearchPeopleResultProfile {
  return {
    vkUserId: Number(profile.vkUserId),
    firstName: profile.firstName,
    lastName: profile.lastName,
    screenName: profile.screenName,
    photoUrl: profile.photoUrl,
    city: profile.city ? referenceFromProto(profile.city) : undefined,
    country: profile.country ? referenceFromProto(profile.country) : undefined,
    homeTown: profile.homeTown,
    university: profile.university ? referenceFromProto(profile.university) : undefined,
    faculty: profile.faculty ? referenceFromProto(profile.faculty) : undefined,
    graduationYear: profile.graduationYear,
    bdateRaw: profile.bdateRaw,
    age: profile.age,
    onlineStatus: onlineStatusFromProto(profile.onlineStatus),
    lastSeenAt: profile.lastSeenAt ? timestampToDate(profile.lastSeenAt) : undefined,
    relation: relationFromProto(profile.relation),
    visibility: visibilityFromProto(profile.visibility),
    privateMessageStatus: privateMessageStatusFromProto(profile.privateMessageStatus),
  };
}

function referenceFromProto(reference: VkReference) {
  return {
    id: reference.id,
    title: reference.title,
  };
}

function onlineStatusFromProto(status: VkOnlineStatus): SearchPeopleResultProfile['onlineStatus'] {
  switch (status) {
    case VkOnlineStatus.ONLINE:
      return 'ONLINE';
    case VkOnlineStatus.OFFLINE:
      return 'OFFLINE';
    default:
      return 'UNSPECIFIED';
  }
}

function relationFromProto(status: VkRelationStatus): SearchPeopleResultProfile['relation'] {
  switch (status) {
    case VkRelationStatus.UNKNOWN:
      return 'UNKNOWN';
    case VkRelationStatus.NOT_SPECIFIED:
      return 'NOT_SPECIFIED';
    case VkRelationStatus.SINGLE:
      return 'SINGLE';
    case VkRelationStatus.RELATIONSHIP:
      return 'RELATIONSHIP';
    case VkRelationStatus.ENGAGED:
      return 'ENGAGED';
    case VkRelationStatus.MARRIED:
      return 'MARRIED';
    case VkRelationStatus.COMPLICATED:
      return 'COMPLICATED';
    case VkRelationStatus.SEARCHING:
      return 'SEARCHING';
    case VkRelationStatus.IN_LOVE:
      return 'IN_LOVE';
    case VkRelationStatus.CIVIL_UNION:
      return 'CIVIL_UNION';
    default:
      return 'UNSPECIFIED';
  }
}

function visibilityFromProto(status: VkProfileVisibility): SearchPeopleResultProfile['visibility'] {
  switch (status) {
    case VkProfileVisibility.OPEN:
      return 'OPEN';
    case VkProfileVisibility.CLOSED:
      return 'CLOSED';
    default:
      return 'UNSPECIFIED';
  }
}

function privateMessageStatusFromProto(
  status: VkPrivateMessageStatus,
): SearchPeopleResultProfile['privateMessageStatus'] {
  switch (status) {
    case VkPrivateMessageStatus.UNKNOWN:
      return 'UNKNOWN';
    case VkPrivateMessageStatus.ALLOWED:
      return 'ALLOWED';
    case VkPrivateMessageStatus.DENIED:
      return 'DENIED';
    default:
      return 'UNSPECIFIED';
  }
}

function vkRelationStatusToProto(
  relation: import('../../domain/models/vk-search-filters').VkRelationStatus,
): VkRelationStatus {
  switch (relation) {
    case 1:
      return VkRelationStatus.UNKNOWN;
    case 2:
      return VkRelationStatus.NOT_SPECIFIED;
    case 3:
      return VkRelationStatus.SINGLE;
    case 4:
      return VkRelationStatus.RELATIONSHIP;
    case 5:
      return VkRelationStatus.ENGAGED;
    case 6:
      return VkRelationStatus.MARRIED;
    case 7:
      return VkRelationStatus.COMPLICATED;
    case 8:
      return VkRelationStatus.SEARCHING;
    case 9:
      return VkRelationStatus.IN_LOVE;
    case 10:
      return VkRelationStatus.CIVIL_UNION;
    default:
      return VkRelationStatus.UNSPECIFIED;
  }
}

function timestampToDate(timestamp: { seconds: bigint; nanos: number }): Date {
  return new Date(Number(timestamp.seconds) * 1000 + Math.floor(timestamp.nanos / 1_000_000));
}
