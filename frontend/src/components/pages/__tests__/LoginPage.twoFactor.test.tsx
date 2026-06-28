import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { useAuth } from '../../../contexts/AuthContext';

jest.mock('../../../contexts/AuthContext');

describe('LoginPage - two-factor challenge', () => {
  const login = jest.fn();
  const verifyTwoFactorLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    login.mockResolvedValue({
      requiresTwoFactor: true,
      challengeToken: 'challenge-token',
    });
    verifyTwoFactorLogin.mockResolvedValue({ passwordExpired: false });
    (useAuth as jest.Mock).mockReturnValue({ login, verifyTwoFactorLogin });
  });

  it('affiche le challenge puis vérifie le code saisi', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText('Adresse email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), {
      target: { value: 'StrongPassword1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Vérification en deux étapes')).toBeInTheDocument();
    expect(screen.queryByLabelText('Mot de passe')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Code d’authentification'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le code' }));

    await waitFor(() => {
      expect(verifyTwoFactorLogin).toHaveBeenCalledWith('challenge-token', '123456');
    });
  });
});
