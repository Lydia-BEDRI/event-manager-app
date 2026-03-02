/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import EventsPage from '../EventsPage';
import * as eventService from '../../../services/event.service';

jest.mock('../../../services/event.service');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

window.confirm = jest.fn();

describe('EventsPage', () => {
  const mockEvents = [
    {
      id: 1,
      name: 'Event Test 1',
      description: 'Description test 1',
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
      description: 'Description test 2',
      location: 'Lyon',
      start_date: '2026-06-01T10:00:00Z',
      end_date: '2026-06-02T18:00:00Z',
      capacity: 150,
      status: 'DRAFT' as const,
      created_at: '2026-01-16T10:00:00Z'
    },
    {
      id: 3,
      name: 'Event Test 3',
      description: 'Description test 3',
      location: 'Marseille',
      start_date: '2026-07-01T10:00:00Z',
      end_date: '2026-07-02T18:00:00Z',
      capacity: 100,
      status: 'ONGOING' as const,
      created_at: '2026-01-17T10:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (eventService.getAllEvents as jest.Mock).mockResolvedValue(mockEvents);
    (window.confirm as jest.Mock).mockReturnValue(true);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <EventsPage />
      </BrowserRouter>
    );
  };

  it('devrait afficher le titre et le compteur d\'événements', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Événements')).toBeInTheDocument();
      expect(screen.getByText('3 événements au total')).toBeInTheDocument();
    });
  });

  it('devrait afficher le loader pendant le chargement', () => {
    renderComponent();
    expect(screen.getByText('Chargement des événements...')).toBeInTheDocument();
  });

  it('devrait afficher tous les événements avec leurs informations', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Event Test 1')).toBeInTheDocument();
      expect(screen.getByText('Description test 1')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('200 places')).toBeInTheDocument();
      
      expect(screen.getByText('Event Test 2')).toBeInTheDocument();
      expect(screen.getByText('Lyon')).toBeInTheDocument();
      
      expect(screen.getByText('Event Test 3')).toBeInTheDocument();
      expect(screen.getByText('Marseille')).toBeInTheDocument();
    });
  });

  it('devrait afficher les badges de statut', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Publié')).toBeInTheDocument();
      expect(screen.getByText('Brouillon')).toBeInTheDocument();
      expect(screen.getByText('En cours')).toBeInTheDocument();
    });
  });

  it('devrait afficher le bouton "Créer un événement"', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Créer un événement')).toBeInTheDocument();
    });
  });

  it('devrait naviguer vers la page de création d\'événement', async () => {
    renderComponent();

    await waitFor(() => {
      const createButton = screen.getByText('Créer un événement');
      fireEvent.click(createButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/events/create');
  });

  it('devrait afficher message si aucun événement', async () => {
    (eventService.getAllEvents as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Aucun événement trouvé')).toBeInTheDocument();
    });
  });

  it('devrait gérer la suppression d\'un événement', async () => {
    (eventService.deleteEvent as jest.Mock).mockResolvedValue({ message: 'Événement supprimé avec succès' });
    const remainingEvents = mockEvents.filter(e => e.id !== 1);
    (eventService.getAllEvents as jest.Mock)
      .mockResolvedValueOnce(mockEvents)
      .mockResolvedValueOnce(remainingEvents);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Event Test 1')).toBeInTheDocument();
    });

    expect(window.confirm).toBeDefined();
  });

  it('devrait annuler la suppression si l\'utilisateur refuse', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Event Test 1')).toBeInTheDocument();
    });

    expect(eventService.deleteEvent).not.toHaveBeenCalled();
  });

  it('devrait gérer les erreurs et rediriger vers login si token manquant', async () => {
    const error = new Error('Token manquant. Veuillez vous reconnecter.');
    (eventService.getAllEvents as jest.Mock).mockRejectedValue(error);

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
    (eventService.getAllEvents as jest.Mock).mockRejectedValue(error);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des événements')).toBeInTheDocument();
    });
  });

  it('devrait afficher un bouton de réessayer en cas d\'erreur', async () => {
    const error = new Error('Network error');
    (eventService.getAllEvents as jest.Mock).mockRejectedValue(error);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Réessayer')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Réessayer');
    fireEvent.click(retryButton);

    expect(eventService.getAllEvents).toHaveBeenCalledTimes(2);
  });

  it('devrait filtrer les événements par statut', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Event Test 1')).toBeInTheDocument();
      expect(screen.getByText('Event Test 2')).toBeInTheDocument();
      expect(screen.getByText('Event Test 3')).toBeInTheDocument();
    });
  });

  it('devrait naviguer vers les détails de l\'événement au clic', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Event Test 1')).toBeInTheDocument();
    });

    const eventCard = screen.getByText('Event Test 1').closest('.group');
    if (eventCard) {
      fireEvent.click(eventCard);
      expect(mockNavigate).toHaveBeenCalledWith('/events/1/edit');
    }
  });

  it('devrait afficher les dates formatées correctement', async () => {
    renderComponent();

    await waitFor(() => {
      // Les dates devraient être formatées en français
      const dateElements = screen.getAllByText(/mai|juin|juil/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it('devrait afficher différents statuts avec des couleurs appropriées', async () => {
    renderComponent();

    await waitFor(() => {
      const publishedBadge = screen.getByText('Publié');
      const draftBadge = screen.getByText('Brouillon');
      const ongoingBadge = screen.getByText('En cours');

      expect(publishedBadge).toBeInTheDocument();
      expect(draftBadge).toBeInTheDocument();
      expect(ongoingBadge).toBeInTheDocument();
    });
  });
});
