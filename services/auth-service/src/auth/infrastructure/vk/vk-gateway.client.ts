import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom, Observable } from 'rxjs';

import type { ExchangeOAuthCodeRequest, ExchangeOAuthCodeResponse } from '@findnmeet/ts-types/vk/v1';

type VkGatewayGrpcService = {
  exchangeOAuthCode(request: ExchangeOAuthCodeRequest): Observable<ExchangeOAuthCodeResponse>;
};

@Injectable()
export class VkGatewayClient implements OnModuleInit {
  private service!: VkGatewayGrpcService;
  private readonly client: ClientGrpc;

  constructor() {
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

  async exchangeOAuthCode(request: ExchangeOAuthCodeRequest): Promise<ExchangeOAuthCodeResponse> {
    return firstValueFrom(this.service.exchangeOAuthCode(request));
  }
}
