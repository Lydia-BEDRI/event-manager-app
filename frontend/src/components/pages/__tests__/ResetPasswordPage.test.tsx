import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ResetPasswordPage from '../ResetPasswordPage';
import { useAuth } from '../../../contexts/AuthContext';

jest.mock('../../../contexts/AuthContext');

describe('ResetPasswordPage', () => {
  const resetPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.history.pushState({}, '', '/reset-password?token=email-reset-token');
    resetPassword.mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ resetPassword });
  });

  it('utilise le token du lien reçu par e-mail pour changer le mot de passe', async () => {
    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>,
    );

    expect(screen.queryByLabelText('Token de réinitialisation')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'StrongPassword1!' },
    });
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), {
      target: { value: 'StrongPassword1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser le mot de passe' }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('email-reset-token', 'StrongPassword1!');
    });
    expect(await screen.findByText('Mot de passe modifié')).toBeInTheDocument();
  });

  it('affiche une erreur lorsque le token est refusé par le backend', async () => {
    resetPassword.mockRejectedValue({ error: 'Token invalide ou expiré.' });

    render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), {
      target: { value: 'StrongPassword1!' },
    });
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), {
      target: { value: 'StrongPassword1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser le mot de passe' }));

    expect(await screen.findByText('Token invalide ou expiré.')).toBeInTheDocument();
  });
});
