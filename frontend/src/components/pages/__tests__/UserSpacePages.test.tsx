/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import AvailableEventsPage from '../AvailableEventsPage';
import MyParticipationsPage from '../MyParticipationsPage';
import MyQrCodesPage from '../MyQrCodesPage';
import PresenceVerificationPage from '../PresenceVerificationPage';
import {
  generateParticipationQrCode,
  getMyParticipantStats,
  getMyQrCodes,
  requestEventParticipation,
  verifyPresence,
} from '../../../services/participation.service';
import { getAllZones, getEventZones } from '../../../services/zone.service';
import { useAuth } from '../../../contexts/AuthContext';

jest.mock('../../../services/participation.service');
jest.mock('../../../services/zone.service');
jest.mock('../../../contexts/AuthContext');

const mockStats = {
  stats: {
    total_participations: 2,
    approved_participations: 1,
    pending_participations: 1,
    refused_participations: 0,
  },
  zoneAccess: {
    unique_zones_visited: 1,
    total_zone_accesses: 2,
  },
  myParticipations: [
    {
      id: 1,
      status: 'APPROVED' as const,
      qr_code: null,
      created_at: '2026-06-01T10:00:00Z',
      approved_at: '2026-06-02T10:00:00Z',
      event_id: 10,
      event_name: 'Conférence Tech 2026',
      event_location: 'Paris',
      event_start_date: '2026-07-01T09:00:00Z',
      event_end_date: '2026-07-01T18:00:00Z',
      event_capacity: 200,
      event_status: 'PUBLISHED' as const,
    },
    {
      id: 2,
      status: 'PENDING' as const,
      qr_code: null,
      created_at: '2026-06-05T10:00:00Z',
      approved_at: null,
      event_id: 11,
      event_name: 'Workshop React',
      event_location: 'Lyon',
      event_start_date: '2026-08-01T09:00:00Z',
      event_end_date: '2026-08-01T18:00:00Z',
      event_capacity: 80,
      event_status: 'PUBLISHED' as const,
    },
  ],
  availableEvents: [
    {
      id: 12,
      name: 'Forum Innovation',
      description: 'Rencontres autour des produits numériques',
      location: 'Nice',
      start_date: '2026-09-15T09:00:00Z',
      end_date: '2026-09-15T17:00:00Z',
      capacity: 150,
      status: 'PUBLISHED' as const,
      current_participants: 45,
    },
  ],
  upcomingEvents: [],
  pastEvents: [],
};

describe('User space pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 3, role: 'PARTICIPANT' },
    });
  });

  describe('AvailableEventsPage', () => {
    it('affiche les événements disponibles et envoie une demande de participation', async () => {
      (getMyParticipantStats as jest.Mock).mockResolvedValue(mockStats);
      (requestEventParticipation as jest.Mock).mockResolvedValue({ id: 9, status: 'PENDING' });

      render(<AvailableEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Forum Innovation')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));

      await waitFor(() => {
        expect(requestEventParticipation).toHaveBeenCalledWith(12);
      });
      await waitFor(() => {
        expect(screen.getByText(/Demande de participation envoyée/i)).toBeInTheDocument();
      });
    });

    it('affiche un état vide quand aucun événement disponible', async () => {
      (getMyParticipantStats as jest.Mock).mockResolvedValue({ ...mockStats, availableEvents: [] });

      render(<AvailableEventsPage />);

      await waitFor(() => {
        expect(screen.getByText('Aucun événement disponible pour le moment.')).toBeInTheDocument();
      });
    });
  });

  describe('MyParticipationsPage', () => {
    it('affiche les participations et génère un QR code', async () => {
      (getMyParticipantStats as jest.Mock).mockResolvedValue(mockStats);
      (generateParticipationQrCode as jest.Mock).mockResolvedValue({
        id: 1,
        qr_code: 'QR-GENERATED',
        qr_code_data: 'data:image/png;base64,abc',
      });

      render(<MyParticipationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Conférence Tech 2026')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Générer mon QR code/i }));

      await waitFor(() => {
        expect(generateParticipationQrCode).toHaveBeenCalledWith(1);
      });
    });

    it('filtre les participations par statut', async () => {
      (getMyParticipantStats as jest.Mock).mockResolvedValue(mockStats);

      render(<MyParticipationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Conférence Tech 2026')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'En attente' }));

      expect(screen.queryByText('Conférence Tech 2026')).not.toBeInTheDocument();
      expect(screen.getByText('Workshop React')).toBeInTheDocument();
    });
  });

  describe('MyQrCodesPage', () => {
    it('affiche les QR codes existants', async () => {
      (getMyQrCodes as jest.Mock).mockResolvedValue([
        {
          id: 1,
          event_id: 10,
          qr_code: 'QR-EVT10-USR3',
          qr_code_data: 'data:image/png;base64,abc',
          event_name: 'Conférence Tech 2026',
          event_location: 'Paris',
          event_start_date: '2026-07-01T09:00:00Z',
          event_end_date: '2026-07-01T18:00:00Z',
        },
      ]);
      (getMyParticipantStats as jest.Mock).mockResolvedValue({
        ...mockStats,
        myParticipations: [{ ...mockStats.myParticipations[0], qr_code: 'QR-EVT10-USR3' }],
      });

      render(<MyQrCodesPage />);

      await waitFor(() => {
        expect(screen.getByText('QR-EVT10-USR3')).toBeInTheDocument();
      });
      expect(screen.getByAltText('QR code Conférence Tech 2026')).toBeInTheDocument();
    });

    it('propose de générer les QR codes manquants', async () => {
      (getMyQrCodes as jest.Mock).mockResolvedValue([]);
      (getMyParticipantStats as jest.Mock).mockResolvedValue(mockStats);
      (generateParticipationQrCode as jest.Mock).mockResolvedValue({
        id: 1,
        qr_code: 'QR-GENERATED',
        qr_code_data: 'data:image/png;base64,abc',
      });

      render(<MyQrCodesPage />);

      await waitFor(() => {
        expect(screen.getByText('QR codes à générer')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Générer/i }));

      await waitFor(() => {
        expect(generateParticipationQrCode).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('PresenceVerificationPage', () => {
    it('valide une présence participant avec événement et zone', async () => {
      (getMyQrCodes as jest.Mock).mockResolvedValue([
        {
          id: 1,
          event_id: 10,
          qr_code: 'QR-EVT10-USR3',
          qr_code_data: null,
          event_name: 'Conférence Tech 2026',
          event_location: 'Paris',
          event_start_date: '2026-07-01T09:00:00Z',
          event_end_date: '2026-07-01T18:00:00Z',
        },
      ]);
      (getEventZones as jest.Mock).mockResolvedValue([
        { id: 5, event_id: 10, name: 'Hall Principal', capacity: 200, created_at: '2026-01-01T00:00:00Z' },
      ]);
      (verifyPresence as jest.Mock).mockResolvedValue({
        id: 30,
        is_valid: true,
        participant_name: 'Charlie Durand',
        event_name: 'Conférence Tech 2026',
        zone_name: 'Hall Principal',
        scanned_at: '2026-06-23T10:00:00Z',
      });

      render(<PresenceVerificationPage />);

      await waitFor(() => {
        expect(screen.getByText('Conférence Tech 2026')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Événement/i), { target: { value: '10' } });

      await waitFor(() => {
        expect(screen.getByText('Hall Principal')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Zone/i), { target: { value: '5' } });
      fireEvent.click(screen.getByRole('button', { name: /Valider la présence/i }));

      await waitFor(() => {
        expect(verifyPresence).toHaveBeenCalledWith('QR-EVT10-USR3', 5);
      });
      await waitFor(() => {
        expect(screen.getByText('Accès autorisé')).toBeInTheDocument();
      });
    });

    it('charge toutes les zones pour un admin', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { id: 1, role: 'ADMIN' },
      });
      (getAllZones as jest.Mock).mockResolvedValue([
        { id: 7, event_id: 20, name: 'Zone VIP', capacity: 30, created_at: '2026-01-01T00:00:00Z' },
      ]);

      render(<PresenceVerificationPage />);

      await waitFor(() => {
        expect(screen.getByText('Zone VIP')).toBeInTheDocument();
      });
      expect(getAllZones).toHaveBeenCalled();
    });
  });
});
