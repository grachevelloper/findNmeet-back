import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  CompleteVkOAuthRequest,
  CompleteVkWebAuthRequest,
  CompleteVkOAuthResponse,
  GetExternalLinksRequest,
  GetExternalLinksResponse,
  GetUserRequest,
  GetUserResponse,
  GetVkAccessTokenRequest,
  GetVkAccessTokenResponse,
  RefreshSessionRequest,
  RefreshSessionResponse,
  RevokeSessionRequest,
  RevokeSessionResponse,
} from '@findnmeet/ts-types/auth/v1';

import { CompleteVkOAuthUseCase } from '../../../auth/application/use-cases/complete-vk-oauth.use-case';
import { CompleteVkWebAuthUseCase } from '../../../auth/application/use-cases/complete-vk-web-auth.use-case';
import { GetExternalLinksUseCase } from '../../../auth/application/use-cases/get-external-links.use-case';
import { GetUserUseCase } from '../../../auth/application/use-cases/get-user.use-case';
import { GetVkAccessTokenUseCase } from '../../../auth/application/use-cases/get-vk-access-token.use-case';
import { RefreshSessionUseCase } from '../../../auth/application/use-cases/refresh-session.use-case';
import { RevokeSessionUseCase } from '../../../auth/application/use-cases/revoke-session.use-case';
import {
  completeVkOAuthCommandFromProto,
  completeVkOAuthResponseToProto,
  completeVkWebAuthCommandFromProto,
  getExternalLinksResponseToProto,
  getUserIdFromProto,
  getUserResponseToProto,
  getVkAccessTokenResponseToProto,
  refreshSessionResponseToProto,
  refreshTokenFromProto,
  revokeSessionResponseToProto,
} from '../mappers/auth-protobuf.mapper';

@Controller()
export class AuthGrpcController {
  constructor(
    private readonly completeVkOAuthUseCase: CompleteVkOAuthUseCase,
    private readonly completeVkWebAuthUseCase: CompleteVkWebAuthUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getExternalLinksUseCase: GetExternalLinksUseCase,
    private readonly getVkAccessTokenUseCase: GetVkAccessTokenUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
  ) {}

  @GrpcMethod('AuthService', 'CompleteVkOAuth')
  async completeVkOAuth(request: CompleteVkOAuthRequest): Promise<CompleteVkOAuthResponse> {
    const result = await this.completeVkOAuthUseCase.execute(completeVkOAuthCommandFromProto(request));
    return completeVkOAuthResponseToProto(result);
  }

  @GrpcMethod('AuthService', 'CompleteVkWebAuth')
  async completeVkWebAuth(request: CompleteVkWebAuthRequest): Promise<CompleteVkOAuthResponse> {
    const result = await this.completeVkWebAuthUseCase.execute(completeVkWebAuthCommandFromProto(request));
    return completeVkOAuthResponseToProto(result);
  }

  @GrpcMethod('AuthService', 'GetUser')
  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    const result = await this.getUserUseCase.execute({ userId: getUserIdFromProto(request) });
    return getUserResponseToProto(result);
  }

  @GrpcMethod('AuthService', 'GetExternalLinks')
  async getExternalLinks(request: GetExternalLinksRequest): Promise<GetExternalLinksResponse> {
    const externalLinks = await this.getExternalLinksUseCase.execute({ userId: getUserIdFromProto(request) });
    return getExternalLinksResponseToProto(externalLinks);
  }

  @GrpcMethod('AuthService', 'GetVkAccessToken')
  async getVkAccessToken(request: GetVkAccessTokenRequest): Promise<GetVkAccessTokenResponse> {
    const result = await this.getVkAccessTokenUseCase.execute({ userId: getUserIdFromProto(request) });
    return getVkAccessTokenResponseToProto(result.accessToken);
  }

  @GrpcMethod('AuthService', 'RefreshSession')
  async refreshSession(request: RefreshSessionRequest): Promise<RefreshSessionResponse> {
    const result = await this.refreshSessionUseCase.execute({ refreshToken: refreshTokenFromProto(request) });
    return refreshSessionResponseToProto(result);
  }

  @GrpcMethod('AuthService', 'RevokeSession')
  async revokeSession(request: RevokeSessionRequest): Promise<RevokeSessionResponse> {
    await this.revokeSessionUseCase.execute({ refreshToken: refreshTokenFromProto(request) });
    return revokeSessionResponseToProto();
  }
}
