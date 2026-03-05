/* eslint-disable testing-library/no-wait-for-multiple-assertions */
/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParticipantDashboard from '../ParticipantDashboard';
import { useAuth } from '../../../contexts/AuthContext';
import { getMyParticipantStats } from '../../../services/participation.service';

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/participation.service');

describe('ParticipantDashboard', () => {
  const mockAccessToken = 'mock-access-token';

  const mockStats = {
    stats: {
      total_participations: 5,
      approved_participations: 3,
      pending_participations: 1,
      refused_participations: 1,
    },
    zoneAccess: {
      unique_zones_visited: 2,
      total_zone_accesses: 10,
    },
    myParticipations: [
      {
        id: 1,
        event_id: 1,
        event_name: 'Conférence Tech 2026',
        event_location: 'Paris',
        event_start_date: '2026-05-01T10:00:00Z',
        status: 'APPROVED' as const,
        qr_code: 'QR123456',
        zone_count: 2,
      },
      {
        id: 2,
        event_id: 2,
        event_name: 'Workshop React',
        event_location: 'Lyon',
        event_start_date: '2026-04-15T14:00:00Z',
        status: 'PENDING' as const,
        qr_code: null,
        zone_count: 1,
      },
      {
        id: 3,
        event_id: 3,
        event_name: 'Hackathon 2026',
        event_location: 'Marseille',
        event_start_date: '2026-06-10T09:00:00Z',
        status: 'APPROVED' as const,
        qr_code: 'QR789012',
        zone_count: 3,
      },
    ],
    availableEvents: [
      {
        id: 4,
        name: 'Conférence Cybersécurité',
        location: 'Toulouse',
        start_date: '2026-07-01T10:00:00Z',
        end_date: '2026-07-01T18:00:00Z',
        total_capacity: 200,
        available_places: 50,
      },
      {
        id: 5,
        name: 'Forum Innovation',
        location: 'Nice',
        start_date: '2026-08-15T09:00:00Z',
        end_date: '2026-08-15T17:00:00Z',
        total_capacity: 150,
        available_places: 100,
      },
    ],
    upcomingEvents: [
      {
        id: 1,
        name: 'Conférence Tech 2026',
        location: 'Paris',
        start_date: '2026-05-01T10:00:00Z',
        end_date: '2026-05-01T18:00:00Z',
        qr_code: 'QR123456',
      },
      {
        id: 2,
        name: 'Workshop React',
        location: 'Lyon',
        start_date: '2026-04-15T14:00:00Z',
        end_date: '2026-04-15T18:00:00Z',
        qr_code: null,
      },
    ],
    pastEvents: [
      {
        id: 6,
        name: 'Meetup JavaScript',
        location: 'Bordeaux',
        start_date: '2026-02-10T19:00:00Z',
        end_date: '2026-02-10T22:00:00Z',
        zone_count: 1,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      accessToken: mockAccessToken,
    });
  });

  describe('Rendering - Loading State', () => {
    it('devrait afficher le message de chargement', () => {
      (getMyParticipantStats as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      render(<ParticipantDashboard />);

      expect(screen.getByText('Chargement de votre dashboard...')).toBeInTheDocument();
    });
  });

  describe('Rendering - Success State', () => {
    beforeEach(() => {
      (getMyParticipantStats as jest.Mock).mockResolvedValue(mockStats);
    });

    it('devrait afficher le titre et la description du dashboard', async () => {
      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Mon espace participant')).toBeInTheDocument();
      });

      expect(screen.getByText('Gérez vos événements et vos participations')).toBeInTheDocument();
    });

    it('devrait afficher la section zones visitées', async () => {
      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Zones visitées')).toBeInTheDocument();
      });

      // Vérifier que la section des zones est présente
      expect(screen.getByText(/accès total/i)).toBeInTheDocument();
    });

    it('devrait afficher les statuts corrects pour les participations', async () => {
      render(<ParticipantDashboard />);

      await waitFor(() => {
        const statuses = screen.queryAllByText(/Validé|En attente|Refusé/);
        expect(statuses.length).toBeGreaterThan(0);
      });
    });

    it('devrait afficher les événements disponibles', async () => {
      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Conférence Cybersécurité')).toBeInTheDocument();
      });

      expect(screen.getByText('Forum Innovation')).toBeInTheDocument();
    });

    it('devrait afficher le bouton "S\'inscrire" pour les événements disponibles', async () => {
      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Conférence Cybersécurité')).toBeInTheDocument();
      });

      const inscriptionButtons = screen.getAllByText(/S'inscrire/i);
      expect(inscriptionButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait afficher les QR codes pour les événements à venir', async () => {
      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Mes QR Codes')).toBeInTheDocument();
      });

      expect(screen.getByText('1 actif')).toBeInTheDocument();
    });

    it('devrait afficher les prochains événements', async () => {
      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Prochains événements')).toBeInTheDocument();
      });

      const eventNames = screen.getAllByText(/Conférence Tech 2026|Workshop React/);
      expect(eventNames.length).toBeGreaterThan(0);
    });

    it('devrait afficher l\'historique des événements passés', async () => {
      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Historique')).toBeInTheDocument();
      });

      expect(screen.getByText('Meetup JavaScript')).toBeInTheDocument();
    });
  });

  describe('Rendering - Error State', () => {
    it('devrait afficher un message d\'erreur en cas d\'échec', async () => {
      const errorMessage = 'Erreur de chargement des statistiques';
      (getMyParticipantStats as jest.Mock).mockRejectedValue({
        error: errorMessage,
      });

      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Rendering - Empty States', () => {
    it('devrait ne pas afficher la section QR codes si aucun QR code disponible', async () => {
      const emptyStats = {
        ...mockStats,
        upcomingEvents: [],
      };

      (getMyParticipantStats as jest.Mock).mockResolvedValue(emptyStats);

      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Mon espace participant')).toBeInTheDocument();
      });

      expect(screen.queryByText('Mes QR Codes')).not.toBeInTheDocument();
    });

    it('devrait afficher "Aucun événement disponible" si pas d\'événements', async () => {
      const emptyStats = {
        ...mockStats,
        availableEvents: [],
      };

      (getMyParticipantStats as jest.Mock).mockResolvedValue(emptyStats);

      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Aucun événement disponible')).toBeInTheDocument();
      });
    });

    it('devrait afficher "Aucune participation" si pas de participations', async () => {
      const emptyStats = {
        ...mockStats,
        myParticipations: [],
      };

      (getMyParticipantStats as jest.Mock).mockResolvedValue(emptyStats);

      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Aucune participation')).toBeInTheDocument();
      });
    });

    it('ne devrait pas afficher la section "Prochains événements" si pas d\'événements à venir', async () => {
      const emptyStats = {
        ...mockStats,
        upcomingEvents: [],
      };

      (getMyParticipantStats as jest.Mock).mockResolvedValue(emptyStats);

      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Mon espace participant')).toBeInTheDocument();
      });

      expect(screen.queryByText('Prochains événements')).not.toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('devrait appeler getMyParticipantStats au montage du composant', async () => {
      (getMyParticipantStats as jest.Mock).mockResolvedValue(mockStats);

      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(getMyParticipantStats).toHaveBeenCalledTimes(1);
      });
    });

    it('ne devrait pas appeler l\'API si pas d\'accessToken', () => {
      (useAuth as jest.Mock).mockReturnValue({
        accessToken: null,
      });

      render(<ParticipantDashboard />);

      expect(getMyParticipantStats).not.toHaveBeenCalled();
    });

    it('devrait recharger les données si l\'accessToken change', async () => {
      const { rerender } = render(<ParticipantDashboard />);

      (useAuth as jest.Mock).mockReturnValue({
        accessToken: 'new-token',
      });

      rerender(<ParticipantDashboard />);

      await waitFor(() => {
        expect(getMyParticipantStats).toHaveBeenCalled();
      });
    });
  });

  describe('Date Formatting', () => {
    it('devrait formater correctement les dates', async () => {
      (getMyParticipantStats as jest.Mock).mockResolvedValue(mockStats);

      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Mon espace participant')).toBeInTheDocument();
      });

      const dateElements = screen.getAllByText(/mai 2026|avr\.|juin|févr\./i);
      expect(dateElements.length).toBeGreaterThan(0);
    });

    it('devrait afficher "Date non disponible" pour une date invalide', async () => {
      const invalidDateStats = {
        ...mockStats,
        myParticipations: [
          {
            ...mockStats.myParticipations[0],
            event_start_date: 'invalid-date',
          },
        ],
      };

      (getMyParticipantStats as jest.Mock).mockResolvedValue(invalidDateStats);

      render(<ParticipantDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Date invalide')).toBeInTheDocument();
      });
    });
  });
});
