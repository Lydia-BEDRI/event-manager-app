import { Request, Response } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'eventmanager_refresh_token';
const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type SameSite = 'lax' | 'strict' | 'none';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function getSameSite(): SameSite {
  const value = process.env.REFRESH_COOKIE_SAMESITE?.toLowerCase();
  if (value === 'strict' || value === 'none') {
    return value;
  }
  return 'lax';
}

function shouldUseSecureCookie(): boolean {
  return isProduction() || getSameSite() === 'none';
}

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: getSameSite(),
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  } as const;
}

export function setRefreshTokenCookie(res: Response, refreshToken: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    path: '/api/auth',
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: getSameSite(),
  });
}

export function getRefreshTokenFromRequest(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .map((cookie) => {
      const separatorIndex = cookie.indexOf('=');
      if (separatorIndex === -1) {
        return [cookie, ''] as const;
      }
      return [
        cookie.slice(0, separatorIndex),
        decodeURIComponent(cookie.slice(separatorIndex + 1)),
      ] as const;
    })
    .find(([name]) => name === REFRESH_TOKEN_COOKIE_NAME)?.[1];
}
