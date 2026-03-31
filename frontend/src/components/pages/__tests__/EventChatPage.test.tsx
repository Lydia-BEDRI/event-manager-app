/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as eventService from '../../../services/event.service';
import * as chatService from '../../../services/chat.service';
import { useAuth } from '../../../contexts/AuthContext';

jest.mock('../../../services/chat.service');
jest.mock('../../../services/event.service');
jest.mock('../../../contexts/AuthContext');
jest.mock('socket.io-client');

describe('EventChatPage', () => {
  const token = 'tok-1';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('accessToken', token);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('affiche le loader pendant le chargement', () => {
    (eventService.getEventById as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (chatService.getChatMessages as jest.Mock).mockImplementation(() => new Promise(() => {}));
    (chatService.getChatMembers as jest.Mock).mockImplementation(() => new Promise(() => {}));

    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 2, firstName: 'A', lastName: 'B', role: 'USER' },
    });

    const EventChatPage = require('../EventChatPage').default;
    render(<EventChatPage />);

    expect(screen.getByText('Chargement du chat...')).toBeInTheDocument();
  });
});

