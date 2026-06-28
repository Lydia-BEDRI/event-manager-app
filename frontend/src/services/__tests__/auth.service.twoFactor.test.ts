import { authService } from '../auth.service';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('Auth service - two-factor endpoints', () => {
  const accessToken = 'access-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('vérifie le challenge de connexion', async () => {
    (api.post as jest.Mock).mockResolvedValue({ accessToken: 'token' });

    await authService.verifyTwoFactorLogin('challenge-token', '123456');

    expect(api.post).toHaveBeenCalledWith('/auth/2fa/login/verify', {
      challengeToken: 'challenge-token',
      code: '123456',
    });
  });

  it('récupère le statut 2FA', async () => {
    (api.get as jest.Mock).mockResolvedValue({ enabled: false, backupCodesRemaining: 0 });

    await authService.getTwoFactorStatus(accessToken);

    expect(api.get).toHaveBeenCalledWith('/auth/2fa/status', accessToken);
  });

  it('configure puis active la 2FA', async () => {
    (api.post as jest.Mock).mockResolvedValue({});

    await authService.setupTwoFactor(accessToken);
    await authService.enableTwoFactor('123456', accessToken);

    expect(api.post).toHaveBeenNthCalledWith(1, '/auth/2fa/setup', {}, accessToken);
    expect(api.post).toHaveBeenNthCalledWith(2, '/auth/2fa/enable', { code: '123456' }, accessToken);
  });

  it('désactive la 2FA avec le mot de passe et le second facteur', async () => {
    (api.post as jest.Mock).mockResolvedValue({});

    await authService.disableTwoFactor('StrongPassword1!', '123456', accessToken);

    expect(api.post).toHaveBeenCalledWith('/auth/2fa/disable', {
      password: 'StrongPassword1!',
      code: '123456',
    }, accessToken);
  });

  it('régénère les codes de secours', async () => {
    (api.post as jest.Mock).mockResolvedValue({ backupCodes: [] });

    await authService.regenerateBackupCodes('123456', accessToken);

    expect(api.post).toHaveBeenCalledWith('/auth/2fa/backup-codes', { code: '123456' }, accessToken);
  });
});
