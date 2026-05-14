import { create } from '@bufbuild/protobuf';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import {
  AuthenticatedUserSchema,
  CompleteVkOAuthResponseSchema,
  GetExternalLinksResponseSchema,
  GetUserResponseSchema,
  RefreshSessionResponseSchema,
  RevokeSessionResponseSchema,
  SessionSchema,
  UserExternalLinkSchema,
  UserSchema,
  UserStatus,
  VkExternalLinkMetadataSchema,
} from '@findnmeet/ts-types/auth/v1';
import type {
  AuthenticatedUser,
  CompleteVkOAuthRequest,
  CompleteVkOAuthResponse,
  GetExternalLinksRequest,
  GetExternalLinksResponse,
  GetUserRequest,
  GetUserResponse,
  RefreshSessionRequest,
  RefreshSessionResponse,
  RevokeSessionRequest,
  RevokeSessionResponse,
  Session,
  User as ProtoUser,
  UserExternalLink as ProtoUserExternalLink,
} from '@findnmeet/ts-types/auth/v1';
import { Provider, SensitiveStringSchema, UuidSchema } from '@findnmeet/ts-types/shared/v1';

import type {
  AuthenticatedUserResult,
} from '../../../auth/application/dto/authenticated-user.result';
import type { CompleteVkOAuthResult } from '../../../auth/application/dto/complete-vk-oauth.result';
import type { RefreshSessionResult } from '../../../auth/application/dto/refresh-session.result';
import type { IssuedSession } from '../../../auth/application/dto/issued-session.dto';
import type { UserExternalLink as DomainUserExternalLink } from '../../../auth/domain/models/user-external-link';
import type { User as DomainUser } from '../../../auth/domain/models/user';
import { UserStatus as DomainUserStatus } from '../../../auth/domain/models/user-status';

export function completeVkOAuthCommandFromProto(request: CompleteVkOAuthRequest) {
  return {
    code: request.code,
    state: request.state,
    redirectUri: request.redirectUri,
    codeVerifier: request.codeVerifier,
  };
}

export function getUserIdFromProto(request: GetUserRequest | GetExternalLinksRequest): string | undefined {
  return request.userId?.value;
}

export function refreshTokenFromProto(request: RefreshSessionRequest | RevokeSessionRequest): string | undefined {
  return request.refreshToken?.value;
}

export function completeVkOAuthResponseToProto(result: CompleteVkOAuthResult): CompleteVkOAuthResponse {
  return create(CompleteVkOAuthResponseSchema, {
    user: authenticatedUserToProto({ user: result.user, externalLinks: result.externalLinks }),
    session: sessionToProto(result.session),
    result: result.result,
  });
}

export function getUserResponseToProto(result: AuthenticatedUserResult): GetUserResponse {
  return create(GetUserResponseSchema, { user: authenticatedUserToProto(result) });
}

export function getExternalLinksResponseToProto(externalLinks: DomainUserExternalLink[]): GetExternalLinksResponse {
  return create(GetExternalLinksResponseSchema, { externalLinks: externalLinks.map(externalLinkToProto) });
}

export function refreshSessionResponseToProto(result: RefreshSessionResult): RefreshSessionResponse {
  return create(RefreshSessionResponseSchema, { session: sessionToProto(result.session) });
}

export function revokeSessionResponseToProto(): RevokeSessionResponse {
  return create(RevokeSessionResponseSchema, {});
}

function authenticatedUserToProto(result: AuthenticatedUserResult): AuthenticatedUser {
  return create(AuthenticatedUserSchema, {
    user: userToProto(result.user),
    externalLinks: result.externalLinks.map(externalLinkToProto),
  });
}

function userToProto(user: DomainUser): ProtoUser {
  return create(UserSchema, {
    id: create(UuidSchema, { value: user.id }),
    createdAt: timestampFromDate(user.createdAt),
    updatedAt: timestampFromDate(user.updatedAt),
    lastActiveAt: timestampFromDate(user.lastActiveAt),
    status: userStatusToProto(user.status),
  });
}

function externalLinkToProto(link: DomainUserExternalLink): ProtoUserExternalLink {
  return create(UserExternalLinkSchema, {
    id: create(UuidSchema, { value: link.id }),
    userId: create(UuidSchema, { value: link.userId }),
    provider: Provider.VK,
    externalId: link.externalId,
    linkedAt: timestampFromDate(link.linkedAt),
    updatedAt: timestampFromDate(link.updatedAt),
    providerMetadata: {
      case: 'vk',
      value: create(VkExternalLinkMetadataSchema, { screenName: String(link.providerMeta?.screenName ?? '') }),
    },
  });
}

function sessionToProto(session: IssuedSession): Session {
  return create(SessionSchema, {
    accessToken: create(SensitiveStringSchema, { value: session.accessToken }),
    refreshToken: create(SensitiveStringSchema, { value: session.refreshToken }),
    expiresAt: timestampFromDate(session.expiresAt),
  });
}

function userStatusToProto(status: number): UserStatus {
  switch (status) {
    case DomainUserStatus.ACTIVE:
      return UserStatus.ACTIVE;
    case DomainUserStatus.DISABLED:
      return UserStatus.DISABLED;
    default:
      return UserStatus.UNKNOWN;
  }
}
