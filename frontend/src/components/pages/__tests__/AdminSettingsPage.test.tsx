/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminSettingsPage from '../AdminSettingsPage';
import { useAuth } from '../../../contexts/AuthContext';

jest.mock('../../../contexts/AuthContext');

jest.mock('lucide-react', () => ({
  Bell: () => <div data-testid="icon-bell" />,
  CheckCircle: () => <div data-testid="icon-check" />,
  Database: () => <div data-testid="icon-database" />,
  Download: () => <div data-testid="icon-download" />,
  Lock: () => <div data-testid="icon-lock" />,
  Mail: () => <div data-testid="icon-mail" />,
  Save: () => <div data-testid="icon-save" />,
  Settings: () => <div data-testid="icon-settings" />,
  ShieldCheck: () => <div data-testid="icon-shield" />,
  UserCog: () => <div data-testid="icon-user" />,
}));

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: {
        firstName: 'Alice',
        lastName: 'Martin',
        email: 'alice.admin@test.com',
        role: 'ADMIN',
      },
    });
  });

  it('devrait afficher les sections de paramètres administrateur', () => {
    render(<AdminSettingsPage />);

    expect(screen.getByRole('heading', { name: 'Paramètres administrateur' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Données & exports' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sécurité' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Compte admin' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'État application' })).toBeInTheDocument();
  });

  it('devrait afficher les informations du compte admin connecté', () => {
    render(<AdminSettingsPage />);

    expect(screen.getByText('Alice Martin')).toBeInTheDocument();
    expect(screen.getByText('alice.admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('devrait sauvegarder les préférences dans le localStorage', () => {
    render(<AdminSettingsPage />);

    const weeklySummaryToggle = screen.getByLabelText(/Résumé hebdomadaire/i);
    fireEvent.click(weeklySummaryToggle);

    fireEvent.change(screen.getByLabelText(/Format d'export préféré/i), {
      target: { value: 'xlsx' },
    });

    fireEvent.click(screen.getByText('Enregistrer'));

    expect(screen.getByText('Paramètres enregistrés.')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('adminSettings') || '{}')).toMatchObject({
      weeklySummary: true,
      defaultExportFormat: 'xlsx',
    });
  });

  it('devrait restaurer les préférences sauvegardées', () => {
    localStorage.setItem('adminSettings', JSON.stringify({
      notifyPendingRequests: false,
      weeklySummary: true,
      defaultExportFormat: 'xlsx',
    }));

    render(<AdminSettingsPage />);

    expect(screen.getByLabelText(/Demandes en attente/i)).not.toBeChecked();
    expect(screen.getByLabelText(/Résumé hebdomadaire/i)).toBeChecked();
    expect(screen.getByLabelText(/Format d'export préféré/i)).toHaveValue('xlsx');
  });
});
