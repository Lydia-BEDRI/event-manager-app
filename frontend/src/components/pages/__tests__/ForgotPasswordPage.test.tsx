import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ForgotPasswordPage from '../ForgotPasswordPage';
import { useAuth } from '../../../contexts/AuthContext';

jest.mock('../../../contexts/AuthContext');

describe('ForgotPasswordPage', () => {
  const forgotPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    forgotPassword.mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({ forgotPassword });
  });

  it('demande un e-mail puis affiche une confirmation générique', async () => {
    render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText('Adresse email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith('user@example.com');
    });
    expect(await screen.findByText('Email envoyé')).toBeInTheDocument();
    expect(screen.queryByText(/token de reset/i)).not.toBeInTheDocument();
  });

  it('affiche une erreur lorsque la demande échoue', async () => {
    forgotPassword.mockRejectedValue({ error: 'Service e-mail indisponible.' });

    render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText('Adresse email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

    expect(await screen.findByText('Service e-mail indisponible.')).toBeInTheDocument();
  });
});
