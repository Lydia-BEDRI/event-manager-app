import crypto from 'crypto';
import { Request, Response } from 'express';
import pool from '../config/database';
import { forgotPassword, resetPassword } from '../controllers/auth.controller';
import { sendPasswordResetEmail } from '../services/email.service';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

jest.mock('../services/email.service', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

describe('Auth Controller - password reset', () => {
  let json: jest.Mock;
  let status: jest.Mock;
  let response: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'https://events.example.com';
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    response = { json, status };
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);
  });

  afterAll(() => {
    delete process.env.FRONTEND_URL;
  });

  it('envoie un lien public et stocke uniquement le hash du token', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 42 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 7 }])
      .mockResolvedValueOnce([{ insertId: 8 }]);

    await forgotPassword({
      body: { email: 'user@example.com' },
      ip: '127.0.0.1',
    } as Request, response as Response);

    const emailPayload = (sendPasswordResetEmail as jest.Mock).mock.calls[0][0];
    const resetUrl = new URL(emailPayload.resetLink);
    const rawToken = resetUrl.searchParams.get('token');
    const insertArguments = (pool.query as jest.Mock).mock.calls[2][1];

    expect(resetUrl.origin).toBe('https://events.example.com');
    expect(resetUrl.pathname).toBe('/reset-password');
    expect(rawToken).toHaveLength(64);
    expect(insertArguments[1]).toBe(
      crypto.createHash('sha256').update(rawToken as string).digest('hex'),
    );
    expect(insertArguments[1]).not.toBe(rawToken);
    expect(emailPayload).toEqual(expect.objectContaining({
      to: 'user@example.com',
      expiresInMinutes: 60,
    }));
    expect(json).toHaveBeenCalledWith({
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    });
  });

  it('retourne la même réponse sans envoyer de mail pour une adresse inconnue', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

    await forgotPassword({
      body: { email: 'unknown@example.com' },
      ip: '127.0.0.1',
    } as Request, response as Response);

    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    });
  });

  it('recherche le hash du token reçu lors de la réinitialisation', async () => {
    const rawToken = 'reset-token-from-email';
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 5, user_id: 42 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 2 }])
      .mockResolvedValueOnce([{ insertId: 9 }]);

    await resetPassword({
      body: { token: rawToken, password: 'StrongPassword1!' },
      ip: '127.0.0.1',
    } as Request, response as Response);

    expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual([expectedHash]);
    expect(json).toHaveBeenCalledWith({
      message: 'Mot de passe réinitialisé avec succès. Veuillez vous reconnecter.',
    });
  });
});
