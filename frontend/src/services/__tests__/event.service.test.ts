/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { 
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../event.service';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Event Service', () => {
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('accessToken', mockAccessToken);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getAllEvents', () => {
    it('devrait récupérer tous les événements avec succès', async () => {
      const mockEvents = [
        {
          id: 1,
          name: 'Event Test 1',
          description: 'Description test',
          location: 'Paris',
          start_date: '2026-05-01T10:00:00Z',
          end_date: '2026-05-02T18:00:00Z',
          capacity: 100,
          status: 'PUBLISHED',
          created_at: '2026-01-15T10:00:00Z'
        },
        {
          id: 2,
          name: 'Event Test 2',
          description: 'Description test 2',
          location: 'Lyon',
          start_date: '2026-06-01T10:00:00Z',
          end_date: '2026-06-02T18:00:00Z',
          capacity: 200,
          status: 'DRAFT',
          created_at: '2026-01-16T10:00:00Z'
        }
      ];

      (api.get as jest.Mock).mockResolvedValueOnce(mockEvents);

      const result = await getAllEvents();

      expect(api.get).toHaveBeenCalledWith('/events', mockAccessToken);
      expect(result).toEqual(mockEvents);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      await expect(getAllEvents()).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
    });
  });

  describe('getEventById', () => {
    it('devrait récupérer un événement par ID', async () => {
      const mockEvent = {
        id: 1,
        name: 'Event Test',
        description: 'Description',
        location: 'Paris',
        start_date: '2026-05-01T10:00:00Z',
        end_date: '2026-05-02T18:00:00Z',
        capacity: 100,
        status: 'PUBLISHED'
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockEvent);

      const result = await getEventById(1);

      expect(api.get).toHaveBeenCalledWith('/events/1', mockAccessToken);
      expect(result).toEqual(mockEvent);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      await expect(getEventById(1)).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
    });
  });

  describe('createEvent', () => {
    it('devrait créer un événement avec zones', async () => {
      const eventData = {
        name: 'Event Test',
        description: 'Description test',
        location: 'Paris',
        start_date: '2026-05-01T10:00:00',
        end_date: '2026-05-02T18:00:00',
        capacity: 200,
        status: 'DRAFT' as const,
        zones: [
          { name: 'Zone A', description: 'Zone A', capacity: 100 },
          { name: 'Zone B', description: 'Zone B', capacity: 100 }
        ]
      };

      const mockResponse = {
        id: 1,
        ...eventData,
        created_at: '2026-01-15T10:00:00Z'
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await createEvent(eventData);

      expect(api.post).toHaveBeenCalledWith('/events', eventData, mockAccessToken);
      expect(result).toEqual(mockResponse);
    });

    it('devrait créer un événement sans zones', async () => {
      const eventData = {
        name: 'Event Test',
        description: 'Description test',
        location: 'Paris',
        start_date: '2026-05-01T10:00:00',
        end_date: '2026-05-02T18:00:00',
        capacity: 100,
        status: 'DRAFT' as const,
        zones: []
      };

      const mockResponse = {
        id: 1,
        ...eventData,
        created_at: '2026-01-15T10:00:00Z'
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await createEvent(eventData);

      expect(api.post).toHaveBeenCalledWith('/events', eventData, mockAccessToken);
      expect(result).toEqual(mockResponse);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      const eventData = {
        name: 'Event Test',
        location: 'Paris',
        start_date: '2026-05-01T10:00:00',
        end_date: '2026-05-02T18:00:00',
        capacity: 100,
        status: 'DRAFT' as const,
        zones: []
      };

      await expect(createEvent(eventData)).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
    });
  });

  describe('updateEvent', () => {
    it('devrait mettre à jour un événement avec succès', async () => {
      const updateData = {
        name: 'Event Updated',
        capacity: 150,
        status: 'PUBLISHED' as const
      };

      const mockResponse = {
        id: 1,
        name: 'Event Updated',
        description: 'Description',
        location: 'Paris',
        start_date: '2026-05-01T10:00:00Z',
        end_date: '2026-05-02T18:00:00Z',
        capacity: 150,
        status: 'PUBLISHED',
        created_at: '2026-01-15T10:00:00Z'
      };

      (api.put as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await updateEvent(1, updateData);

      expect(api.put).toHaveBeenCalledWith('/events/1', updateData, mockAccessToken);
      expect(result).toEqual(mockResponse);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      const updateData = {
        name: 'Event Updated'
      };

      await expect(updateEvent(1, updateData)).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
    });
  });

  describe('deleteEvent', () => {
    it('devrait supprimer un événement avec succès', async () => {
      const mockResponse = { message: 'Événement supprimé avec succès' };

      (api.delete as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await deleteEvent(1);

      expect(api.delete).toHaveBeenCalledWith('/events/1', mockAccessToken);
      expect(result).toEqual(mockResponse);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      await expect(deleteEvent(1)).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
    });
  });
});
