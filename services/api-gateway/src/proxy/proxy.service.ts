import { Inject, Injectable, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { create } from '@bufbuild/protobuf';
import { firstValueFrom } from 'rxjs';

import { grpcToHttpError } from '../common/errors/grpc-to-http';
import { gatewayConfig, type GatewayRoute } from '../config/gateway.config';
import type { RequestAuthContext } from '../auth/request-auth-context';

type GrpcMethod = (request: unknown, metadata?: Metadata) => unknown;
type ServiceMap = Record<string, GrpcMethod>;

@Injectable()
export class ProxyService implements OnModuleInit {
  private authService!: ServiceMap;
  private favoritesService!: ServiceMap;
  private searchService!: ServiceMap;
  private readonly config = gatewayConfig();

  constructor(
    @Inject('AUTH_GRPC_CLIENT') private readonly authClient: ClientGrpc,
    @Inject('FAVORITES_GRPC_CLIENT') private readonly favoritesClient: ClientGrpc,
    @Inject('SEARCH_GRPC_CLIENT') private readonly searchClient: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.authService = this.authClient.getService<ServiceMap>('AuthService');
    this.favoritesService = this.favoritesClient.getService<ServiceMap>('FavoritesService');
    this.searchService = this.searchClient.getService<ServiceMap>('SearchOrchestratorService');
  }

  findRoute(method: string, path: string): GatewayRoute | undefined {
    return this.config.routes.find((route) => route.method === method && route.path === path);
  }

  async dispatch(route: GatewayRoute, payload: Record<string, unknown>, auth?: RequestAuthContext) {
    const requestPayload = route.injectUserId
      ? {
          ...payload,
          userId: { value: auth?.userId ?? '' },
        }
      : payload;

    const requestMessage = (create as (schema: object, value: Record<string, unknown>) => unknown)(
      route.requestSchema,
      requestPayload,
    );
    const metadata = route.metadataUserId ? metadataWithUserId(auth) : undefined;
    const service =
      route.service === 'auth'
        ? this.authService
        : route.service === 'favorites'
          ? this.favoritesService
          : this.searchService;
    const method = service[route.rpc];

    if (typeof method !== 'function') {
      throw new NotFoundException(`RPC method not found for route ${route.path}`);
    }

    try {
      if (metadata) {
        return await firstValueFrom(method.call(service, requestMessage, metadata) as never);
      }

      return await firstValueFrom(method.call(service, requestMessage) as never);
    } catch (error) {
      throw grpcToHttpError(error);
    }
  }
}

function metadataWithUserId(auth?: RequestAuthContext): Metadata {
  if (!auth?.userId) {
    throw new UnauthorizedException('Authenticated user context is required');
  }

  const metadata = new Metadata();
  metadata.set('x-user-id', auth.userId);
  if (auth.roles.length > 0) {
    metadata.set('x-user-roles', auth.roles.join(','));
  }
  return metadata;
}
