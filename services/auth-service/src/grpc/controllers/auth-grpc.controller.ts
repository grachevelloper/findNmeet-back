import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
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
} from '@findnmeet/ts-types/auth/v1';

import { AuthApplicationService } from '../../auth/application/auth.service';
import {
  completeVkOAuthCommandFromProto,
  completeVkOAuthResponseToProto,
  getExternalLinksResponseToProto,
  getUserIdFromProto,
  getUserResponseToProto,
  refreshSessionResponseToProto,
  refreshTokenFromProto,
  revokeSessionResponseToProto,
} from '../mappers/auth-protobuf.mapper';

@Controller()
export class AuthGrpcController {
  constructor(private readonly authService: AuthApplicationService) {}

  @GrpcMethod('AuthService', 'CompleteVkOAuth')
  async completeVkOAuth(request: CompleteVkOAuthRequest): Promise<CompleteVkOAuthResponse> {
    const result = await this.authService.completeVkOAuth(completeVkOAuthCommandFromProto(request));
    return completeVkOAuthResponseToProto(result);
  }

  @GrpcMethod('AuthService', 'GetUser')
  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    const result = await this.authService.getUser(getUserIdFromProto(request));
    return getUserResponseToProto(result);
  }

  @GrpcMethod('AuthService', 'GetExternalLinks')
  async getExternalLinks(request: GetExternalLinksRequest): Promise<GetExternalLinksResponse> {
    const externalLinks = await this.authService.getExternalLinks(getUserIdFromProto(request));
    return getExternalLinksResponseToProto(externalLinks);
  }

  @GrpcMethod('AuthService', 'RefreshSession')
  async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
    const result = await this.authService.refreshSession(refreshTokenFromProto(request));
    return refreshSessionResponseToProto(result);
  }

  @GrpcMethod('AuthService', 'RevokeSession')
  async revokeSession(request: RevokeSessionRequest): Promise<RevokeSessionResponse> {
    await this.authService.revokeSession(refreshTokenFromProto(request));
    return revokeSessionResponseToProto();
  }
}
