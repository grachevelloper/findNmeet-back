import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { gatewayConfig } from '../config/gateway.config';
import { AccessTokenVerifier } from './access-token-verifier';
import type { AuthenticatedRequest } from './request-auth-context';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly accessTokenVerifier: AccessTokenVerifier) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken = readAccessToken(request);

    if (!accessToken) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const payload = this.accessTokenVerifier.verify(accessToken);
      request.auth = {
        userId: payload.sub,
        roles: payload.roles ?? [],
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}

function readAccessToken(request: AuthenticatedRequest): string | undefined {
  const authorization = request.headers.authorization;
  if (typeof authorization === 'string') {
    const [scheme, token] = authorization.split(' ');
    if (scheme === 'Bearer' && token) {
      return token;
    }
  }

  const cookieName = gatewayConfig().accessTokenCookieName;
  const cookieToken = request.cookies?.[cookieName];
  return typeof cookieToken === 'string' ? cookieToken : undefined;
}
