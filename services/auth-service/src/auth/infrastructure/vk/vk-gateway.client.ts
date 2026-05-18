import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom, Observable } from 'rxjs';

import type {
  ExchangeOAuthCodeRequest,
  ExchangeOAuthCodeResponse,
  GetCurrentProfileRequest,
  GetCurrentProfileResponse,
  RefreshOAuthTokensRequest,
  RefreshOAuthTokensResponse,
} from '@findnmeet/ts-types/vk/v1';
import { VkOAuthProvider } from '../../application/ports/vk-oauth-provider';

type VkGatewayGrpcService = {
  exchangeOAuthCode(request: ExchangeOAuthCodeRequest): Observable<ExchangeOAuthCodeResponse>;
  getCurrentProfile(request: GetCurrentProfileRequest): Observable<GetCurrentProfileResponse>;
  refreshOAuthTokens(request: RefreshOAuthTokensRequest): Observable<RefreshOAuthTokensResponse>;
};

@Injectable()
export class VkGatewayClient extends VkOAuthProvider implements OnModuleInit {
  private service!: VkGatewayGrpcService;
  private readonly client: ClientGrpc;

  constructor() {
    super();
    const contractsProtoRoot = join(__dirname, '../../../../../../contracts/proto');

    this.client = ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: 'findnmeet.vk.v1',
        protoPath: join(contractsProtoRoot, 'findnmeet/vk/v1/service.proto'),
        url: process.env.VK_GATEWAY_GRPC_URL ?? '127.0.0.1:50054',
        loader: {
          includeDirs: [contractsProtoRoot],
        },
      },
    }) as ClientGrpc;
  }

  onModuleInit(): void {
    this.service = this.client.getService<VkGatewayGrpcService>('VkGatewayService');
  }

  async exchangeOAuthCode(request: ExchangeOAuthCodeRequest): Promise<ExchangeOAuthCodeResponse> {
    return firstValueFrom(this.service.exchangeOAuthCode(request));
  }

  async getCurrentProfile(request: GetCurrentProfileRequest): Promise<GetCurrentProfileResponse> {
    return firstValueFrom(this.service.getCurrentProfile(request));
  }

  async refreshOAuthTokens(request: RefreshOAuthTokensRequest): Promise<RefreshOAuthTokensResponse> {
    return firstValueFrom(this.service.refreshOAuthTokens(request));
  }
}
