/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import ParticipantsPage from '../ParticipantsPage';
import { getAllEvents } from '../../../services/event.service';
import {
  getAllParticipations,
  getParticipationsByEvent,
  updateParticipationStatus,
} from '../../../services/participation.service';

jest.mock('../../../services/event.service');
jest.mock('../../../services/participation.service');

let mockSearchParams = new URLSearchParams();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

const participations = [
  {
    id: 1,
    user_id: 3,
    event_id: 10,
    status: 'PENDING' as const,
    qr_code: null,
    created_at: '2026-06-01T10:00:00Z',
    approved_at: null,
    email: 'charlie@example.com',
    first_name: 'Charlie',
    last_name: 'Durand',
    event_name: 'Conférence Tech',
    event_location: 'Paris',
    event_start_date: '2026-07-01T09:00:00Z',
    approved_by_first_name: null,
    approved_by_last_name: null,
  },
  {
    id: 2,
    user_id: 4,
    event_id: 11,
    status: 'APPROVED' as const,
    qr_code: 'QR-EVT11-USR4',
    created_at: '2026-06-02T10:00:00Z',
    approved_at: '2026-06-03T10:00:00Z',
    email: 'diana@example.com',
    first_name: 'Diana',
    last_name: 'Leroy',
    event_name: 'Forum Data',
    event_location: 'Lyon',
    event_start_date: '2026-08-01T09:00:00Z',
    approved_by_first_name: 'Alice',
    approved_by_last_name: 'Martin',
  },
];

const renderPage = (initialEntry = '/participants') => {
  mockSearchParams = new URLSearchParams(initialEntry.split('?')[1] || '');
  return render(<ParticipantsPage />);
};

describe('ParticipantsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    (getAllEvents as jest.Mock).mockResolvedValue([
      {
        id: 10,
        name: 'Conférence Tech',
        location: 'Paris',
        start_date: '2026-07-01T09:00:00Z',
        end_date: '2026-07-01T18:00:00Z',
        capacity: 200,
        status: 'PUBLISHED',
        created_at: '2026-01-01T00:00:00Z',
      },
    ]);
    (getAllParticipations as jest.Mock).mockResolvedValue(participations);
    (getParticipationsByEvent as jest.Mock).mockResolvedValue([participations[0]]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('affiche la liste des participations', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Charlie Durand').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Diana Leroy').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Conférence Tech').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Forum Data').length).toBeGreaterThan(0);
  });

  it('filtre les participations depuis le paramètre status', async () => {
    renderPage('/participants?status=PENDING');

    await waitFor(() => {
      expect(screen.getAllByText('Charlie Durand').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('Diana Leroy')).not.toBeInTheDocument();
  });

  it('recherche par email', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Charlie Durand').length).toBeGreaterThan(0);
    });

    fireEvent.change(screen.getByPlaceholderText('Rechercher par nom, email ou événement'), {
      target: { value: 'diana@example.com' },
    });

    expect(screen.queryByText('Charlie Durand')).not.toBeInTheDocument();
    expect(screen.getAllByText('Diana Leroy').length).toBeGreaterThan(0);
  });

  it('approuve une participation en attente', async () => {
    (updateParticipationStatus as jest.Mock).mockResolvedValue({
      ...participations[0],
      status: 'APPROVED',
      qr_code: 'QR-GENERATED',
      approved_by_first_name: 'Alice',
      approved_by_last_name: 'Martin',
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Charlie Durand').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Approuver/i })[0]);

    await waitFor(() => {
      expect(updateParticipationStatus).toHaveBeenCalledWith(1, 'APPROVED');
    });
    await waitFor(() => {
      expect(screen.getByText('Participation approuvée et QR code généré.')).toBeInTheDocument();
    });
  });
});
