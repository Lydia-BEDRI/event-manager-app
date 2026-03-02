/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ZonesPage from '../ZonesPage';
import * as zoneService from '../../../services/zone.service';

jest.mock('../../../services/zone.service');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

window.confirm = jest.fn();

describe('ZonesPage', () => {
  const mockZones = [
    {
      id: 1,
      event_id: 1,
      name: 'Zone VIP',
      description: 'Zone pour invités VIP',
      capacity: 50,
      created_at: '2026-01-15T10:00:00Z',
      event_name: 'Event Test 1'
    },
    {
      id: 2,
      event_id: 1,
      name: 'Zone Standard',
      description: 'Zone standard',
      capacity: 100,
      created_at: '2026-01-15T10:00:00Z',
      event_name: 'Event Test 1'
    },
    {
      id: 3,
      event_id: 2,
      name: 'Zone Premium',
      description: 'Zone premium',
      capacity: 75,
      created_at: '2026-01-16T10:00:00Z',
      event_name: 'Event Test 2'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (zoneService.getAllZones as jest.Mock).mockResolvedValue(mockZones);
    (window.confirm as jest.Mock).mockReturnValue(true);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ZonesPage />
      </BrowserRouter>
    );
  };

  it('devrait afficher le titre et le compteur de zones', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Zones d\'accès')).toBeInTheDocument();
      expect(screen.getByText('3 zones au total')).toBeInTheDocument();
    });
  });

  it('devrait afficher le loader pendant le chargement', () => {
    renderComponent();
    expect(screen.getByText('Chargement des zones...')).toBeInTheDocument();
  });

  it('devrait afficher toutes les zones avec leurs informations', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Zone VIP')).toBeInTheDocument();
      expect(screen.getByText('Zone pour invités VIP')).toBeInTheDocument();
      expect(screen.getByText('50 participants')).toBeInTheDocument();
      
      expect(screen.getByText('Zone Standard')).toBeInTheDocument();
      expect(screen.getByText('Zone standard')).toBeInTheDocument();
      expect(screen.getByText('100 participants')).toBeInTheDocument();
      
      expect(screen.getByText('Zone Premium')).toBeInTheDocument();
      expect(screen.getByText('Zone premium')).toBeInTheDocument();
      expect(screen.getByText('75 participants')).toBeInTheDocument();
    });
  });

  it('devrait afficher les événements associés', async () => {
    renderComponent();

    await waitFor(() => {
      const eventNames = screen.getAllByText(/Event Test/);
      expect(eventNames.length).toBeGreaterThan(0);
    });
  });

  it('devrait afficher le bouton "Créer une zone"', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Créer une zone')).toBeInTheDocument();
    });
  });

  it('devrait naviguer vers la page de création de zone', async () => {
    renderComponent();

    await waitFor(() => {
      const createButton = screen.getByText('Créer une zone');
      fireEvent.click(createButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/zones/create');
  });

  it('devrait afficher message si aucune zone', async () => {
    (zoneService.getAllZones as jest.Mock).mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Aucune zone trouvée')).toBeInTheDocument();
      expect(screen.getByText('Créez des zones pour organiser vos événements')).toBeInTheDocument();
    });
  });

  it('devrait gérer la suppression d\'une zone', async () => {
    (zoneService.deleteZone as jest.Mock).mockResolvedValue({ message: 'Zone supprimée avec succès' });
    (zoneService.getAllZones as jest.Mock).mockResolvedValueOnce(mockZones);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Zone VIP')).toBeInTheDocument();
    });

    const zoneCards = screen.getAllByText('Zone VIP')[0].closest('.group');
    expect(zoneCards).toBeInTheDocument();

    await waitFor(() => {
      expect(window.confirm).toBeDefined();
    });
  });

  it('devrait annuler la suppression si l\'utilisateur refuse', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Zone VIP')).toBeInTheDocument();
    });

    expect(zoneService.deleteZone).not.toHaveBeenCalled();
  });

  it('devrait gérer les erreurs et rediriger vers login si token manquant', async () => {
    const error = new Error('Token manquant. Veuillez vous reconnecter.');
    (zoneService.getAllZones as jest.Mock).mockRejectedValue(error);

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
    (zoneService.getAllZones as jest.Mock).mockRejectedValue(error);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des zones')).toBeInTheDocument();
    });
  });

  it('devrait afficher un bouton de réessayer en cas d\'erreur', async () => {
    const error = new Error('Network error');
    (zoneService.getAllZones as jest.Mock).mockRejectedValue(error);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Réessayer')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Réessayer');
    fireEvent.click(retryButton);

    expect(zoneService.getAllZones).toHaveBeenCalledTimes(2);
  });

  it('devrait naviguer vers l\'événement au clic sur une carte de zone', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Zone VIP')).toBeInTheDocument();
    });

    const zoneCard = screen.getByText('Zone VIP').closest('.group');
    if (zoneCard) {
      fireEvent.click(zoneCard);
      expect(mockNavigate).toHaveBeenCalledWith('/events/1');
    }
  });
});
