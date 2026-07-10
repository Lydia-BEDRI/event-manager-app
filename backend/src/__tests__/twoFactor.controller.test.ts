import { Request, Response } from 'express';
import QRCode from 'qrcode';
import pool from '../config/database';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import {
  enableTwoFactor,
  getTwoFactorStatus,
  setupTwoFactor,
  verifyTwoFactorLogin,
} from '../controllers/twoFactor.controller';
import {
  createBackupCodes,
  createTwoFactorSecret,
  createTwoFactorUri,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  parseBackupCodeHashes,
  verifyTotpCode,
} from '../services/twoFactor.service';
import { verifyTwoFactorChallengeToken } from '../utils/jwt';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

jest.mock('qrcode', () => ({
  __esModule: true,
  default: { toDataURL: jest.fn() },
}));

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

jest.mock('../services/twoFactor.service', () => ({
  consumeBackupCode: jest.fn(() => ({ valid: false, remainingHashes: [] })),
  createBackupCodes: jest.fn(),
  createTwoFactorSecret: jest.fn(),
  createTwoFactorUri: jest.fn(),
  decryptTwoFactorSecret: jest.fn(),
  encryptTwoFactorSecret: jest.fn(),
  hashBackupCode: jest.fn(() => 'hashed-backup-code'),
  parseBackupCodeHashes: jest.fn(() => []),
  verifyTotpCode: jest.fn(),
}));

jest.mock('../utils/jwt', () => ({
  generateAccessToken: jest.fn(() => 'access-token'),
  generateRefreshToken: jest.fn(() => 'refresh-token'),
  getRefreshExpiresAt: jest.fn(() => new Date('2030-01-01')),
  verifyTwoFactorChallengeToken: jest.fn(),
}));

describe('Two-factor controller', () => {
  const authenticatedRequest = {
    user: { userId: 42, role: 'PARTICIPANT' },
    body: {},
    ip: '127.0.0.1',
  } as unknown as AuthenticatedRequest;
  let json: jest.Mock;
  let status: jest.Mock;
  let response: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    response = { json, status };
    (parseBackupCodeHashes as jest.Mock).mockReturnValue([]);
  });

  it('retourne le statut et le nombre de codes de secours', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([[
      { user_id: 42, secret: 'encrypted-secret', is_enabled: true, backup_codes: '["a","b"]' },
    ]]);
    (parseBackupCodeHashes as jest.Mock).mockReturnValue(['a', 'b']);

    await getTwoFactorStatus(authenticatedRequest, response as Response);

    expect(json).toHaveBeenCalledWith({ enabled: true, backupCodesRemaining: 2 });
  });

  it('prépare un secret chiffré et un QR code sans activer immédiatement la 2FA', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ email: 'user@example.com' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    (createTwoFactorSecret as jest.Mock).mockReturnValue('BASE32SECRET');
    (encryptTwoFactorSecret as jest.Mock).mockReturnValue('encrypted-secret');
    (createTwoFactorUri as jest.Mock).mockReturnValue('otpauth://totp/EventManager');
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,qr');

    await setupTwoFactor(authenticatedRequest, response as Response);

    expect(pool.query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO two_factor_auth'), [
      42,
      'encrypted-secret',
    ]);
    expect(json).toHaveBeenCalledWith({
      secret: 'BASE32SECRET',
      qrCodeDataUrl: 'data:image/png;base64,qr',
    });
  });

  it('active la 2FA uniquement après validation du premier code', async () => {
    const request = { ...authenticatedRequest, body: { code: '123456' } } as AuthenticatedRequest;
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[
        { user_id: 42, secret: 'encrypted-secret', is_enabled: false, backup_codes: null },
      ]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 1 }]);
    (decryptTwoFactorSecret as jest.Mock).mockReturnValue('BASE32SECRET');
    (verifyTotpCode as jest.Mock).mockResolvedValue(true);
    (createBackupCodes as jest.Mock).mockReturnValue({
      plainCodes: ['AAAA-BBBB-CCCC'],
      hashedCodes: ['hashed-code'],
    });

    await enableTwoFactor(request, response as Response);

    expect(verifyTotpCode).toHaveBeenCalledWith('BASE32SECRET', '123456');
    expect(json).toHaveBeenCalledWith({
      message: 'Double authentification activée.',
      backupCodes: ['AAAA-BBBB-CCCC'],
    });
  });

  it('crée la session seulement après un challenge et un code TOTP valides', async () => {
    const request = {
      body: { challengeToken: 'challenge-token', code: '123456' },
      ip: '127.0.0.1',
    } as Request;
    (verifyTwoFactorChallengeToken as jest.Mock).mockReturnValue({
      userId: 42,
      email: 'user@example.com',
      role: 'PARTICIPANT',
    });
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[
        {
          id: 42,
          email: 'user@example.com',
          first_name: 'Ada',
          last_name: 'Lovelace',
          role: 'PARTICIPANT',
          created_at: new Date('2026-01-01'),
          password_updated_at: new Date(),
          is_active: true,
        },
      ]])
      .mockResolvedValueOnce([[
        { user_id: 42, secret: 'encrypted-secret', is_enabled: true, backup_codes: '[]' },
      ]])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([{ insertId: 2 }]);
    (decryptTwoFactorSecret as jest.Mock).mockReturnValue('BASE32SECRET');
    (verifyTotpCode as jest.Mock).mockResolvedValue(true);

    await verifyTwoFactorLogin(request, response as Response);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      backupCodeUsed: false,
    }));
    expect(pool.query).toHaveBeenCalledTimes(4);
  });
});
