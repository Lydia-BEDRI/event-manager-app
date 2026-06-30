import { Request, Response } from 'express';
import { 
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/events.controller';
import pool from '../config/database';
import { createNotification } from '../services/notification.service';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    getConnection: jest.fn(),
  },
}));
jest.mock('../services/notification.service', () => ({
  createNotification: jest.fn(),
}));
jest.mock('../sockets/server.socket', () => ({
  emitNotification: jest.fn(),
}));

describe('Events Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {};
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };
    
    jest.clearAllMocks();
    (createNotification as jest.Mock).mockResolvedValue({ id: 99, user_id: 3 });
  });

  describe('getAllEvents', () => {
    it('devrait récupérer tous les événements avec succès', async () => {
      const mockEvents = [
        {
          id: 1,
          name: 'Event Test 1',
          description: 'Description test',
          location: 'Paris',
          start_date: new Date('2026-05-01'),
          end_date: new Date('2026-05-02'),
          capacity: 100,
          status: 'PUBLISHED',
          created_at: new Date()
        },
        {
          id: 2,
          name: 'Event Test 2',
          description: 'Description test 2',
          location: 'Lyon',
          start_date: new Date('2026-06-01'),
          end_date: new Date('2026-06-02'),
          capacity: 200,
          status: 'DRAFT',
          created_at: new Date()
        }
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockEvents]);

      await getAllEvents(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(mockEvents);
    });

    it('devrait gérer les erreurs serveur', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await getAllEvents(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('getEventById', () => {
    it('devrait récupérer un événement par ID', async () => {
      const mockEvent = [{
        id: 1,
        name: 'Event Test',
        description: 'Description',
        location: 'Paris',
        start_date: new Date('2026-05-01'),
        end_date: new Date('2026-05-02'),
        capacity: 100,
        status: 'PUBLISHED'
      }];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockEvent]);

      mockRequest.params = { id: '1' };

      await getEventById(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(mockEvent[0]);
    });

    it('devrait retourner 404 si l\'événement n\'existe pas', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      mockRequest.params = { id: '999' };

      await getEventById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Événement non trouvé' });
    });

    it('devrait gérer les erreurs serveur', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      mockRequest.params = { id: '1' };

      await getEventById(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('createEvent', () => {
    it('devrait créer un événement avec zones avec succès', async () => {
      const mockConnection = {
        query: jest.fn(),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      const mockResult = { insertId: 1 };
      const mockNewEvent = [{
        id: 1,
        name: 'Event Test',
        capacity: 200,
        status: 'DRAFT'
      }];
      const mockZones = [
        { id: 1, name: 'Zone A', capacity: 100 },
        { id: 2, name: 'Zone B', capacity: 100 }
      ];

      (pool.getConnection as jest.Mock).mockResolvedValueOnce(mockConnection);
      mockConnection.query
        .mockResolvedValueOnce([mockResult])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([mockNewEvent])
        .mockResolvedValueOnce([mockZones]);

      mockRequest.body = {
        name: 'Event Test',
        location: 'Paris',
        start_date: '2026-05-01',
        end_date: '2026-05-02',
        capacity: 200,
        zones: [
          { name: 'Zone A', capacity: 100 },
          { name: 'Zone B', capacity: 100 }
        ]
      };
      (mockRequest as any).user = { userId: 1 };

      await createEvent(mockRequest as Request, mockResponse as Response);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(201);
    });
  });

  describe('updateEvent', () => {
    it('devrait mettre à jour un événement avec succès', async () => {
      const mockConnection = {
        query: jest.fn(),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      const mockEvent = [{ id: 1, name: 'Event Test', capacity: 100 }];
      const mockUpdatedEvent = [{ id: 1, name: 'Event Updated', capacity: 150 }];
      const mockZones:any[] = [];

      (pool.getConnection as jest.Mock).mockResolvedValueOnce(mockConnection);
      mockConnection.query
        .mockResolvedValueOnce([mockEvent])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([mockUpdatedEvent])
        .mockResolvedValueOnce([mockZones]);

      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Event Updated', capacity: 150 };

      await updateEvent(mockRequest as Request, mockResponse as Response);

      expect(mockConnection.commit).toHaveBeenCalled();
      expect(responseJson).toHaveBeenCalled();
    });

    it('devrait retourner 404 si l\'événement n\'existe pas', async () => {
      const mockConnection = {
        query: jest.fn(),
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
      };

      (pool.getConnection as jest.Mock).mockResolvedValueOnce(mockConnection);
      mockConnection.query.mockResolvedValueOnce([[]]);

      mockRequest.params = { id: '999' };
      mockRequest.body = { name: 'Event Test' };

      await updateEvent(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteEvent', () => {
    it('devrait supprimer un événement avec succès', async () => {
      const mockEvent = [{ id: 1, name: 'Event Test' }];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockEvent])
        .mockResolvedValueOnce([{}]);

      mockRequest.params = { id: '1' };

      await deleteEvent(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({ message: 'Événement supprimé avec succès' });
    });

    it('devrait retourner 404 si l\'événement n\'existe pas', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      mockRequest.params = { id: '999' };

      await deleteEvent(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });

    it('devrait gérer les erreurs serveur', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      mockRequest.params = { id: '1' };

      await deleteEvent(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
    });
  });
});
