import { create } from '@bufbuild/protobuf';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

import {
  GetVkAccessTokenRequestSchema,
  type GetVkAccessTokenRequest,
  type GetVkAccessTokenResponse,
} from '@findnmeet/ts-types/auth/v1';
import { UuidSchema } from '@findnmeet/ts-types/shared/v1';
import { CurrentUserVkAccessTokenProvider } from '../../application/abstractions/current-user-vk-access-token-provider';
import { contractsProtoRoot } from '../grpc/contracts-proto-root';

type AuthGrpcService = {
  getVkAccessToken(request: GetVkAccessTokenRequest): Observable<GetVkAccessTokenResponse>;
};

@Injectable()
export class AuthVkAccessTokenClient
  extends CurrentUserVkAccessTokenProvider
  implements OnModuleInit
{
  private service!: AuthGrpcService;
  private readonly client: ClientGrpc;

  constructor() {
    super();
    const protoRoot = contractsProtoRoot(__dirname);

    this.client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'findnmeet.auth.v1',
        protoPath: `${protoRoot}/findnmeet/auth/v1/service.proto`,
        url: process.env.AUTH_SERVICE_GRPC_URL ?? '127.0.0.1:50051',
        loader: {
          includeDirs: [protoRoot],
        },
      },
    }) as ClientGrpc;
  }

  onModuleInit(): void {
    this.service = this.client.getService<AuthGrpcService>('AuthService');
  }

  async getByUserId(userId: string): Promise<string> {
    const serviceToken = process.env.VK_SERVICE_TOKEN?.trim();
    if (serviceToken) {
      return serviceToken;
    }

    const response = await firstValueFrom(
      this.service.getVkAccessToken(
        create(GetVkAccessTokenRequestSchema, {
          userId: create(UuidSchema, { value: userId }),
        }),
      ),
    );
    return response.accessToken?.value ?? '';
  }
}
