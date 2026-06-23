/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import ChatsPage from '../ChatsPage';
import { getChatEvents } from '../../../services/chat.service';

jest.mock('../../../services/chat.service');

describe('ChatsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le loader pendant le chargement', () => {
    (getChatEvents as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<ChatsPage />);

    expect(screen.getByText('Chargement des chats...')).toBeInTheDocument();
  });

  it('affiche la liste des événements chat après chargement', async () => {
    (getChatEvents as jest.Mock).mockResolvedValueOnce([
      {
        id: 7,
        name: 'Fête Test',
        location: 'Lyon',
        startDate: '2026-03-01T10:00:00.000Z',
        endDate: '2026-03-02T18:00:00.000Z',
        status: 'PUBLISHED',
      },
    ]);

    render(<ChatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Chats événementiels')).toBeInTheDocument();
    });

    expect(screen.getByText('Fête Test')).toBeInTheDocument();
    expect(screen.getByText(/Lyon/)).toBeInTheDocument();
  });

  it('affiche un message lorsqu’il n’y a pas d’événements', async () => {
    (getChatEvents as jest.Mock).mockResolvedValueOnce([]);

    render(<ChatsPage />);

    await waitFor(() => {
      expect(screen.getByText('Aucun chat disponible pour le moment.')).toBeInTheDocument();
    });
  });
});
