type SameSite = 'lax' | 'strict' | 'none';

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: SameSite;
  path?: string;
  domain?: string | undefined;
  expires?: Date;
};

type CookieResponse = {
  cookie(name: string, value: string, options: CookieOptions): unknown;
  clearCookie(name: string, options: CookieOptions): unknown;
};

export type AuthSessionCookies = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
};

export type PendingVkAuthCookies = {
  state: string;
  codeVerifier: string;
  returnTo: string;
  responseMode: 'redirect' | 'json';
};

export const OAUTH_STATE_COOKIE = 'fm_vk_oauth_state';
export const OAUTH_CODE_VERIFIER_COOKIE = 'fm_vk_code_verifier';
export const OAUTH_RETURN_TO_COOKIE = 'fm_vk_return_to';
export const OAUTH_RESPONSE_MODE_COOKIE = 'fm_vk_response_mode';

export function setAuthSessionCookies(
  response: CookieResponse,
  session: AuthSessionCookies,
  accessTokenCookieName = 'fm_access_token',
  refreshTokenCookieName = 'fm_refresh_token',
): void {
  response.cookie(accessTokenCookieName, session.accessToken, {
    ...baseCookieOptions(),
    expires: session.accessTokenExpiresAt,
  });
  response.cookie(refreshTokenCookieName, session.refreshToken, {
    ...baseCookieOptions(),
    expires: session.refreshTokenExpiresAt,
  });
}

export function clearAuthSessionCookies(
  response: CookieResponse,
  accessTokenCookieName = 'fm_access_token',
  refreshTokenCookieName = 'fm_refresh_token',
): void {
  response.clearCookie(accessTokenCookieName, baseCookieOptions());
  response.clearCookie(refreshTokenCookieName, baseCookieOptions());
}

export function setPendingVkAuthCookies(response: CookieResponse, auth: PendingVkAuthCookies): void {
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  response.cookie(OAUTH_STATE_COOKIE, auth.state, { ...baseCookieOptions(), expires });
  response.cookie(OAUTH_CODE_VERIFIER_COOKIE, auth.codeVerifier, { ...baseCookieOptions(), expires });
  response.cookie(OAUTH_RETURN_TO_COOKIE, auth.returnTo, { ...baseCookieOptions(), expires });
  response.cookie(OAUTH_RESPONSE_MODE_COOKIE, auth.responseMode, { ...baseCookieOptions(), expires });
}

export function clearPendingVkAuthCookies(response: CookieResponse): void {
  response.clearCookie(OAUTH_STATE_COOKIE, baseCookieOptions());
  response.clearCookie(OAUTH_CODE_VERIFIER_COOKIE, baseCookieOptions());
  response.clearCookie(OAUTH_RETURN_TO_COOKIE, baseCookieOptions());
  response.clearCookie(OAUTH_RESPONSE_MODE_COOKIE, baseCookieOptions());
}

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: cookieSameSite(),
    path: '/',
    domain: process.env.API_GATEWAY_COOKIE_DOMAIN || undefined,
  };
}

function cookieSecure(): boolean {
  if (process.env.API_GATEWAY_COOKIE_SECURE) {
    return process.env.API_GATEWAY_COOKIE_SECURE === 'true';
  }

  return process.env.NODE_ENV === 'production';
}

function cookieSameSite(): SameSite {
  const value = (process.env.API_GATEWAY_COOKIE_SAME_SITE ?? 'lax').toLowerCase();
  if (value === 'strict' || value === 'none') {
    return value;
  }

  return 'lax';
}
