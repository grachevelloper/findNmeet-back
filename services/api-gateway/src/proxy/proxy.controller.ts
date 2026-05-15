import { All, Body, Controller, NotFoundException, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';

import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import type { AuthenticatedRequest } from '../auth/request-auth-context';
import { gatewayConfig, type GatewayRoute } from '../config/gateway.config';
import { ProxyService } from './proxy.service';

@Controller()
@UseGuards(OptionalAuthGuard)
export class ProxyController {
  private readonly config = gatewayConfig();

  constructor(private readonly proxyService: ProxyService) {}

  @All('*path')
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

    const payload = this.buildPayload(route, request, body);
    const result = await this.proxyService.dispatch(route, payload, request.auth);
    this.applySessionCookies(route, response, result);
    return response.json(sanitizeProxyResult(route, result));
  }

  private buildPayload(
    route: GatewayRoute,
    request: AuthenticatedRequest,
    body: Record<string, unknown>,
  ): Record<string, unknown> {
    const payload = route.requestSource === 'query' ? mapQueryToPayload(request.query) : body;
    if (!route.readRefreshTokenFromCookie || payload.refreshToken) {
      return payload;
    }

    const refreshToken = request.cookies?.[this.config.refreshTokenCookieName];
    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      return payload;
    }

    return {
      ...payload,
      refreshToken: { value: refreshToken },
    };
  }

  private applySessionCookies(route: GatewayRoute, response: Response, result: unknown): void {
    if (route.writeSessionCookies) {
      const session = extractSession(result);
      if (!session?.accessToken || !session.refreshToken) {
        throw new UnauthorizedException('Session tokens are missing in auth response');
      }

      const accessOptions = this.cookieOptions(session.expiresAt);
      response.cookie(this.config.accessTokenCookieName, session.accessToken, accessOptions);
      response.cookie(this.config.refreshTokenCookieName, session.refreshToken, this.cookieOptions());
      return;
    }

    if (route.clearSessionCookies) {
      const options = this.cookieOptions();
      response.clearCookie(this.config.accessTokenCookieName, options);
      response.clearCookie(this.config.refreshTokenCookieName, options);
    }
  }

  private cookieOptions(expiresAt?: Date): CookieOptions {
    return {
      httpOnly: true,
      sameSite: this.config.cookieSameSite,
      secure: this.config.cookieSecure,
      path: '/',
      ...(expiresAt ? { expires: expiresAt } : {}),
    };
  }
}

function normalizePath(path: string): string {
  const normalized = path.startsWith('/api/v1') ? path.slice('/api/v1'.length) : path;
  return normalized || '/';
}

function mapQueryToPayload(query: AuthenticatedRequest['query']): Record<string, unknown> {
  return Object.fromEntries(Object.entries(query).map(([key, value]) => [key, value]));
}

type SessionLike = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
};

function extractSession(result: unknown): SessionLike | undefined {
  if (!result || typeof result !== 'object' || !('session' in result)) {
    return undefined;
  }

  const session = (result as { session?: Record<string, unknown> }).session;
  if (!session || typeof session !== 'object') {
    return undefined;
  }

  const expiresAtSeconds = readTimestampSeconds(session.expiresAt);
  return {
    accessToken: readSensitiveString(session.accessToken),
    refreshToken: readSensitiveString(session.refreshToken),
    expiresAt: expiresAtSeconds ? new Date(expiresAtSeconds * 1000) : undefined,
  };
}

function sanitizeProxyResult(route: GatewayRoute, result: unknown): unknown {
  if (!route.writeSessionCookies || !result || typeof result !== 'object' || !('session' in result)) {
    return result;
  }

  const response = result as Record<string, unknown>;
  const session = response.session;
  if (!session || typeof session !== 'object') {
    return result;
  }

  return {
    ...response,
    session: {
      expiresAt: (session as Record<string, unknown>).expiresAt,
    },
  };
}

function readSensitiveString(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || !('value' in value)) {
    return undefined;
  }

  const raw = (value as { value?: unknown }).value;
  return typeof raw === 'string' ? raw : undefined;
}

function readTimestampSeconds(value: unknown): number | undefined {
  if (!value || typeof value !== 'object' || !('seconds' in value)) {
    return undefined;
  }

  const raw = (value as { seconds?: unknown }).seconds;
  if (typeof raw === 'number') {
    return raw;
  }

  if (typeof raw === 'bigint') {
    return Number(raw);
  }

  if (typeof raw === 'string') {
    return Number(raw);
  }

  return undefined;
}
