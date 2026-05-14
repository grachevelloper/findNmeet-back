import { All, Body, Controller, NotFoundException, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { Response } from 'express';

import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import type { AuthenticatedRequest } from '../auth/request-auth-context';
import { ProxyService } from './proxy.service';

@Controller()
@UseGuards(OptionalAuthGuard)
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @All('*')
  async dispatch(@Req() request: AuthenticatedRequest, @Res() response: Response, @Body() body: Record<string, unknown>) {
    const method = request.method.toUpperCase();
    const path = normalizePath(request.path);
    const route = this.proxyService.findRoute(method, path);

    if (!route) {
      throw new NotFoundException(`Route ${method} ${path} is not configured`);
    }

    if (route.auth === 'required' && !request.auth?.userId) {
      throw new UnauthorizedException('Access token is required');
    }

    const payload = route.requestSource === 'query' ? mapQueryToPayload(request.query) : body;
    const result = await this.proxyService.dispatch(route, payload, request.auth);
    return response.json(result);
  }
}

function normalizePath(path: string): string {
  const normalized = path.startsWith('/api/v1') ? path.slice('/api/v1'.length) : path;
  return normalized || '/';
}

function mapQueryToPayload(query: AuthenticatedRequest['query']): Record<string, unknown> {
  return Object.fromEntries(Object.entries(query).map(([key, value]) => [key, value]));
}
