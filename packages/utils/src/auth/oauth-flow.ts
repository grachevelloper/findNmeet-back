import { createHash, randomBytes } from 'crypto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

export type PendingVkAuth = {
  state: string;
  codeVerifier: string;
  returnTo: string;
  responseMode: 'redirect' | 'json';
};

export function createVkLogin(returnTo?: string, responseMode?: 'redirect' | 'json') {
  const state = randomBytes(24).toString('base64url');
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  const validatedReturnTo = normalizeReturnTo(returnTo);
  const nextResponseMode: 'redirect' | 'json' = responseMode === 'json' ? 'json' : 'redirect';

  const authorizeUrl = new URL(process.env.VK_OAUTH_AUTHORIZE_URL ?? 'https://oauth.vk.com/authorize');
  authorizeUrl.searchParams.set('client_id', requireEnv('VK_APP_ID'));
  authorizeUrl.searchParams.set('redirect_uri', requireEnv('VK_REDIRECT_URI'));
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');

  const scope = process.env.VK_OAUTH_SCOPE?.trim();
  if (scope) {
    authorizeUrl.searchParams.set('scope', scope);
  }

  return {
    authorizeUrl: authorizeUrl.toString(),
    pendingAuth: {
      state,
      codeVerifier,
      returnTo: validatedReturnTo,
      responseMode: nextResponseMode,
    } satisfies PendingVkAuth,
  };
}

export function requireExpectedCodeVerifier(state: string, expectedState?: string, codeVerifier?: string): string {
  if (!expectedState || expectedState !== state) {
    throw new UnauthorizedException('Invalid OAuth state');
  }
  if (!codeVerifier) {
    throw new UnauthorizedException('Missing PKCE code verifier');
  }

  return codeVerifier;
}

export function normalizeReturnTo(returnTo?: string): string {
  if (!returnTo) {
    return '/';
  }
  if (!returnTo.startsWith('/')) {
    throw new BadRequestException('return_to must be a relative path');
  }
  if (returnTo.startsWith('//')) {
    throw new BadRequestException('return_to must not be protocol-relative');
  }
  return returnTo;
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}
