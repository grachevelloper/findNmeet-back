import { create } from '@bufbuild/protobuf';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom, Observable } from 'rxjs';

import {
  GetVkAccessTokenRequestSchema,
  type GetVkAccessTokenRequest,
  type GetVkAccessTokenResponse,
} from '@findnmeet/ts-types/auth/v1';
import { UuidSchema } from '@findnmeet/ts-types/shared/v1';
import { CurrentUserVkAccessTokenProvider } from '../../application/abstractions/current-user-vk-access-token-provider';

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
    this.client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'findnmeet.auth.v1',
        protoPath: join(process.cwd(), 'contracts/proto/findnmeet/auth/v1/service.proto'),
        url: process.env.AUTH_SERVICE_GRPC_URL ?? '127.0.0.1:50051',
        loader: {
          includeDirs: [join(process.cwd(), 'contracts/proto')],
        },
      },
    }) as ClientGrpc;
  }

  onModuleInit(): void {
    this.service = this.client.getService<AuthGrpcService>('AuthService');
  }

  async getByUserId(userId: string): Promise<string> {
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
