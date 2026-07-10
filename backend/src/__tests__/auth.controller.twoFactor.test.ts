import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { login } from '../controllers/auth.controller';
import { generateTwoFactorChallengeToken } from '../utils/jwt';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('../utils/jwt', () => ({
  generateAccessToken: jest.fn(() => 'access-token'),
  generateRefreshToken: jest.fn(() => 'refresh-token'),
  generateTwoFactorChallengeToken: jest.fn(() => 'challenge-token'),
  getRefreshExpiresAt: jest.fn(() => new Date('2030-01-01')),
  verifyToken: jest.fn(),
}));

describe('Auth Controller - login with two-factor authentication', () => {
  const user = {
    id: 42,
    email: 'user@example.com',
    password_hash: 'password-hash',
    first_name: 'Ada',
    last_name: 'Lovelace',
    role: 'PARTICIPANT',
    is_active: true,
    failed_login_attempts: 0,
    locked_until: null,
    password_updated_at: new Date(),
    created_at: new Date('2026-01-01'),
  };
  let json: jest.Mock;
  let status: jest.Mock;
  let response: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    response = { json, status };
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('retourne uniquement un challenge lorsque la 2FA est activée', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[user]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ is_enabled: true }]]);

    await login({
      body: { email: user.email, password: 'StrongPassword1!' },
      ip: '127.0.0.1',
    } as Request, response as Response);

    expect(generateTwoFactorChallengeToken).toHaveBeenCalledWith({
      userId: user.id,
      role: user.role,
    });
    expect(json).toHaveBeenCalledWith({
      message: 'Code de double authentification requis.',
      requiresTwoFactor: true,
      challengeToken: 'challenge-token',
    });
    expect(json.mock.calls[0][0]).not.toHaveProperty('accessToken');
    expect(pool.query).toHaveBeenCalledTimes(3);
  });

  it('conserve la connexion classique lorsque la 2FA est désactivée', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[user]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([{ insertId: 2 }]);

    await login({
      body: { email: user.email, password: 'StrongPassword1!' },
      ip: '127.0.0.1',
    } as Request, response as Response);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      passwordExpired: false,
    }));
  });
});
