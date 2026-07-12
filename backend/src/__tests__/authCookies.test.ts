import { Request, Response } from 'express';
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  REFRESH_TOKEN_COOKIE_NAME,
  setRefreshTokenCookie,
} from '../utils/authCookies';

describe('auth cookies', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSameSite = process.env.REFRESH_COOKIE_SAMESITE;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalSameSite === undefined) {
      delete process.env.REFRESH_COOKIE_SAMESITE;
    } else {
      process.env.REFRESH_COOKIE_SAMESITE = originalSameSite;
    }
  });

  it('pose le refresh token dans un cookie HttpOnly restreint au scope auth', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.REFRESH_COOKIE_SAMESITE;
    const cookie = jest.fn();

    setRefreshTokenCookie({ cookie } as unknown as Response, 'refresh-token');

    expect(cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/api/auth',
      }),
    );
  });

  it('force Secure lorsque SameSite=None est configuré', () => {
    process.env.NODE_ENV = 'test';
    process.env.REFRESH_COOKIE_SAMESITE = 'none';
    const cookie = jest.fn();

    setRefreshTokenCookie({ cookie } as unknown as Response, 'refresh-token');

    expect(cookie.mock.calls[0][2]).toEqual(expect.objectContaining({
      secure: true,
      sameSite: 'none',
    }));
  });

  it('efface le cookie avec les mêmes options de scope', () => {
    process.env.NODE_ENV = 'production';
    const clearCookie = jest.fn();

    clearRefreshTokenCookie({ clearCookie } as unknown as Response);

    expect(clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/api/auth',
      }),
    );
  });

  it('lit le refresh token depuis l’en-tête Cookie', () => {
    const req = {
      headers: {
        cookie: `theme=dark; ${REFRESH_TOKEN_COOKIE_NAME}=refresh%20token; other=value`,
      },
    } as Request;

    expect(getRefreshTokenFromRequest(req)).toBe('refresh token');
  });
});
