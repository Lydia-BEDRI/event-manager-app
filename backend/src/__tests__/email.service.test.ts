import nodemailer from 'nodemailer';
import { sendPasswordResetEmail } from '../services/email.service';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe('Email service', () => {
  const sendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    delete process.env.SMTP_FROM;
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    sendMail.mockResolvedValue({ messageId: 'message-id' });
  });

  it('utilise Mailpit par défaut en développement local', async () => {
    await sendPasswordResetEmail({
      to: 'user@example.com',
      resetLink: 'http://localhost:3000/reset-password?token=token',
      expiresInMinutes: 60,
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: undefined,
    });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'EventManager <no-reply@eventmanager.local>',
      to: 'user@example.com',
      subject: expect.stringContaining('Réinitialisation'),
      text: expect.stringContaining('http://localhost:3000/reset-password?token=token'),
      html: expect.stringContaining('http://localhost:3000/reset-password?token=token'),
    }));
  });

  it('utilise la configuration SMTP du VPS avec authentification', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASSWORD = 'smtp-password';
    process.env.SMTP_FROM = 'EventManager <contact@example.com>';

    await sendPasswordResetEmail({
      to: 'user@example.com',
      resetLink: 'https://events.example.com/reset-password?token=token',
      expiresInMinutes: 60,
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: { user: 'smtp-user', pass: 'smtp-password' },
    });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'EventManager <contact@example.com>',
    }));
  });

  it('refuse une configuration SMTP partielle', async () => {
    process.env.SMTP_USER = 'smtp-user';

    await expect(sendPasswordResetEmail({
      to: 'user@example.com',
      resetLink: 'http://localhost/reset-password?token=token',
      expiresInMinutes: 60,
    })).rejects.toThrow('SMTP_USER and SMTP_PASSWORD must be configured together.');
  });
});
