/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ParticipantsPage from '../ParticipantsPage';
import * as participationService from '../../../services/participation.service';
import * as eventService from '../../../services/event.service';

jest.mock('../../../services/participation.service');
jest.mock('../../../services/event.service');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ParticipantsPage', () => {
  const mockParticipations = [
    {
      id: 1,
      user_id: 1,
      event_id: 1,
      status: 'APPROVED' as const,
      qr_code: 'QR123',
      created_at: '2026-01-15T10:00:00Z',
      approved_at: '2026-01-16T10:00:00Z',
      email: 'user1@test.com',
      first_name: 'John',
      last_name: 'Doe',
      event_name: 'Event Test 1',
      event_location: 'Paris',
      event_start_date: '2026-05-01T10:00:00Z',
      approved_by_first_name: 'Admin',
      approved_by_last_name: 'User'
    },
    {
      id: 2,
      user_id: 2,
      event_id: 1,
      status: 'PENDING' as const,
      qr_code: null,
      created_at: '2026-01-17T10:00:00Z',
      approved_at: null,
      email: 'user2@test.com',
      first_name: 'Jane',
      last_name: 'Smith',
      event_name: 'Event Test 1',
      event_location: 'Paris',
      event_start_date: '2026-05-01T10:00:00Z',
      approved_by_first_name: null,
      approved_by_last_name: null
    },
    {
      id: 3,
      user_id: 3,
      event_id: 2,
      status: 'REFUSED' as const,
      qr_code: null,
      created_at: '2026-01-18T10:00:00Z',
      approved_at: '2026-01-19T10:00:00Z',
      email: 'user3@test.com',
      first_name: 'Bob',
      last_name: 'Johnson',
      event_name: 'Event Test 2',
      event_location: 'Lyon',
      event_start_date: '2026-06-01T10:00:00Z',
      approved_by_first_name: 'Admin',
      approved_by_last_name: 'User'
    }
  ];

  const mockEvents = [
    {
      id: 1,
      name: 'Event Test 1',
      description: 'Description',
      location: 'Paris',
      start_date: '2026-05-01T10:00:00Z',
      end_date: '2026-05-02T18:00:00Z',
      capacity: 200,
      status: 'PUBLISHED' as const,
      created_at: '2026-01-15T10:00:00Z'
    },
    {
      id: 2,
      name: 'Event Test 2',
      description: 'Description',
      location: 'Lyon',
      start_date: '2026-06-01T10:00:00Z',
      end_date: '2026-06-02T18:00:00Z',
      capacity: 150,
      status: 'PUBLISHED' as const,
      created_at: '2026-01-16T10:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (participationService.getAllParticipations as jest.Mock).mockResolvedValue(mockParticipations);
    (eventService.getAllEvents as jest.Mock).mockResolvedValue(mockEvents);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ParticipantsPage />
      </BrowserRouter>
    );
  };

  it('devrait afficher le titre et le compteur de participants', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Participants')).toBeInTheDocument();
      expect(screen.getByText('3 participants au total')).toBeInTheDocument();
    });
  });

  it('devrait afficher le loader pendant le chargement', () => {
    renderComponent();
    expect(screen.getByText('Chargement des participants...')).toBeInTheDocument();
  });

  it('devrait afficher tous les participants avec leurs informations', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('user1@test.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('user2@test.com')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('user3@test.com')).toBeInTheDocument();
    });
  });

  it('devrait afficher les événements associés', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Event Test 1')).toBeInTheDocument();
      expect(screen.getByText('Event Test 2')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('Lyon')).toBeInTheDocument();
    });
  });

  it('devrait afficher les badges de statut correctement', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Approuvé')).toBeInTheDocument();
      expect(screen.getByText('En attente')).toBeInTheDocument();
      expect(screen.getByText('Refusé')).toBeInTheDocument();
    });
  });

  it('devrait afficher le filtre par événement', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Filtrer par événement :')).toBeInTheDocument();
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Tous les événements')).toBeInTheDocument();
    });
  });

  it('devrait filtrer les participations par événement', async () => {
    const mockFilteredParticipations = mockParticipations.filter(p => p.event_id === 1);
    (participationService.getParticipationsByEvent as jest.Mock).mockResolvedValue(mockFilteredParticipations);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

    await waitFor(() => {
      expect(participationService.getParticipationsByEvent).toHaveBeenCalledWith(1);
    });
  });

  it('devrait afficher message si aucun participant', async () => {
    (participationService.getAllParticipations as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Aucun participant trouvé')).toBeInTheDocument();
      expect(screen.getByText('Aucune participation enregistrée pour le moment')).toBeInTheDocument();
    });
  });

  it('devrait gérer les erreurs et rediriger vers login si token manquant', async () => {
    const error = new Error('Token manquant. Veuillez vous reconnecter.');
    (participationService.getAllParticipations as jest.Mock).mockRejectedValue(error);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Session expirée/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    }, { timeout: 3000 });
  });

  it('devrait afficher une erreur générique en cas d\'échec', async () => {
    const error = new Error('Network error');
    (participationService.getAllParticipations as jest.Mock).mockRejectedValue(error);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des participations')).toBeInTheDocument();
    });
  });

  it('devrait afficher l\'approbateur si présent', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  it('devrait afficher "-" si pas d\'approbateur', async () => {
    renderComponent();

    await waitFor(() => {
      const cells = screen.getAllByText('-');
      expect(cells.length).toBeGreaterThan(0);
    });
  });
});
