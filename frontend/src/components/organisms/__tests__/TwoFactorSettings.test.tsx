import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TwoFactorSettings from '../TwoFactorSettings';
import { authService } from '../../../services/auth.service';

jest.mock('../../../services/auth.service');

describe('TwoFactorSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.getTwoFactorStatus as jest.Mock).mockResolvedValue({
      enabled: false,
      backupCodesRemaining: 0,
    });
  });

  it('configure le QR code, active la 2FA et affiche les codes de secours', async () => {
    (authService.setupTwoFactor as jest.Mock).mockResolvedValue({
      secret: 'BASE32SECRET',
      qrCodeDataUrl: 'data:image/png;base64,cXJjb2Rl',
    });
    (authService.enableTwoFactor as jest.Mock).mockResolvedValue({
      message: 'Double authentification activée.',
      backupCodes: ['AAAA-BBBB-CCCC', 'DDDD-EEEE-FFFF'],
    });

    render(<TwoFactorSettings accessToken="access-token" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Configurer' }));

    expect(await screen.findByAltText('QR code de configuration de la double authentification')).toBeInTheDocument();
    expect(screen.getByText('BASE32SECRET')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Code à 6 chiffres'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Activer' }));

    await waitFor(() => {
      expect(authService.enableTwoFactor).toHaveBeenCalledWith('123456', 'access-token');
    });
    expect(await screen.findByText('AAAA-BBBB-CCCC')).toBeInTheDocument();
    expect(screen.getByText('DDDD-EEEE-FFFF')).toBeInTheDocument();
    expect(screen.getByText('Activée')).toBeInTheDocument();
  });

  it('affiche le nombre de codes restants lorsque la 2FA est active', async () => {
    (authService.getTwoFactorStatus as jest.Mock).mockResolvedValue({
      enabled: true,
      backupCodesRemaining: 5,
    });

    render(<TwoFactorSettings accessToken="access-token" />);

    expect(await screen.findByText('5 code(s) de secours disponible(s)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Régénérer les codes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Désactiver' })).toBeInTheDocument();
  });
});
