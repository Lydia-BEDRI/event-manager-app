/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import EditEventPage from '../EditEventPage';
import { getEventById, updateEvent } from '../../../services/event.service';
import { getEventZones } from '../../../services/zone.service';

jest.mock('../../../services/event.service');
jest.mock('../../../services/zone.service');

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '42' }),
}));

describe('EditEventPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getEventById as jest.Mock).mockResolvedValue({
      id: 42,
      name: 'Conférence Tech',
      description: 'Une conférence',
      location: 'Paris',
      start_date: '2026-07-10T09:00:00.000Z',
      end_date: '2026-07-10T18:00:00.000Z',
      capacity: 100,
      status: 'DRAFT',
      created_at: '2026-07-01T10:00:00.000Z',
    });
    (getEventZones as jest.Mock).mockResolvedValue([
      {
        id: 7,
        event_id: 42,
        name: 'Hall principal',
        description: 'Accueil',
        capacity: 100,
      },
    ]);
    (updateEvent as jest.Mock).mockResolvedValue({});
  });

  it('envoie une liste vide quand la dernière zone est supprimée', async () => {
    render(<EditEventPage />);

    const deleteButton = await screen.findByRole('button', {
      name: 'Supprimer la zone Hall principal',
    });
    fireEvent.click(deleteButton);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ zones: [] })
      );
    });
  });
});
