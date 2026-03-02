import { Request, Response } from 'express';
import { 
  createZone,
  getAllZones,
  getDistinctZones,
  getEventZones,
  updateZone,
  deleteZone
} from '../controllers/zones.controller';
import pool from '../config/database';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Zones Controller', () => {
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
  });

  describe('createZone', () => {
    it('ca doit créer une zone avec succès', async () => {
      const mockEventData = [{ id: 1, capacity: 200 }];
      const mockResult = { insertId: 1 };
      const mockNewZone = [{
        id: 1,
        event_id: 1,
        name: 'Zone VIP',
        description: 'Zone pour invités VIP',
        capacity: 50,
        created_at: new Date()
      }];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockEventData])
        .mockResolvedValueOnce([mockResult])
        .mockResolvedValueOnce([mockNewZone]);

      mockRequest.params = { eventId: '1' };
      mockRequest.body = {
        name: 'Zone VIP',
        description: 'Zone pour invités VIP',
        capacity: 50
      };

      await createZone(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(mockNewZone[0]);
    });

    it('devrait retourner 404 si lévénement nexiste pas', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      mockRequest.params = { eventId: '999' };
      mockRequest.body = { name: 'Zone Test', capacity: 50 };

      await createZone(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Événement non trouvé' });
    });

    it('devrait gérer les erreurs serveur', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      mockRequest.params = { eventId: '1' };
      mockRequest.body = { name: 'Zone Test', capacity: 50 };

      await createZone(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllZones', () => {
    it('devrait récupérer toutes les zones avec succès', async () => {
      const mockZones = [
        {
          id: 1,
          name: 'Zone VIP',
          description: 'Zone VIP',
          capacity: 50,
          event_id: 1,
          event_name: 'Event Test',
          created_at: new Date()
        },
        {
          id: 2,
          name: 'Zone Standard',
          description: 'Zone Standard',
          capacity: 100,
          event_id: 1,
          event_name: 'Event Test',
          created_at: new Date()
        }
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockZones]);

      await getAllZones(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(mockZones);
    });

    it('devrait gérer les erreurs serveur', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await getAllZones(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
    });
  });

  describe('getDistinctZones', () => {
    it('devrait récupérer les zones distinctes', async () => {
      const mockZones = [
        { name: 'Zone VIP', description: 'Zone VIP', capacity: 50 },
        { name: 'Zone Standard', description: 'Zone Standard', capacity: 100 }
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockZones]);

      await getDistinctZones(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(mockZones);
    });
  });

  describe('getEventZones', () => {
    it('devrait récupérer les zones d\'un événement', async () => {
      const mockZones = [
        { id: 1, event_id: 1, name: 'Zone A', capacity: 50 },
        { id: 2, event_id: 1, name: 'Zone B', capacity: 100 }
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockZones]);

      mockRequest.params = { eventId: '1' };

      await getEventZones(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(mockZones);
    });
  });

  describe('updateZone', () => {
    it('devrait mettre à jour une zone avec succès', async () => {
      const mockZone = [{ id: 1, event_id: 1, name: 'Zone VIP', capacity: 50 }];
      const mockUpdatedZone = [{ id: 1, event_id: 1, name: 'Zone VIP Updated', capacity: 60 }];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockZone])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([mockUpdatedZone]);

      mockRequest.params = { eventId: '1', zoneId: '1' };
      mockRequest.body = { name: 'Zone VIP Updated', capacity: 60 };

      await updateZone(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(mockUpdatedZone[0]);
    });

    it('devrait retourner 404 si la zone n\'existe pas', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      mockRequest.params = { eventId: '1', zoneId: '999' };
      mockRequest.body = { name: 'Zone Test' };

      await updateZone(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });

    it('devrait retourner 400 si aucune donnée à mettre à jour', async () => {
      const mockZone = [{ id: 1, event_id: 1, name: 'Zone VIP' }];
      (pool.query as jest.Mock).mockResolvedValueOnce([mockZone]);

      mockRequest.params = { eventId: '1', zoneId: '1' };
      mockRequest.body = {};

      await updateZone(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteZone', () => {
    it('devrait supprimer une zone avec succès', async () => {
      const mockZone = [{ id: 1, event_id: 1, name: 'Zone VIP' }];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockZone])
        .mockResolvedValueOnce([{}]);

      mockRequest.params = { eventId: '1', zoneId: '1' };

      await deleteZone(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({ message: 'Zone supprimée avec succès' });
    });

    it('devrait retourner 404 si la zone n\'existe pas', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      mockRequest.params = { eventId: '1', zoneId: '999' };

      await deleteZone(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });

    it('devrait gérer les erreurs serveur', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      mockRequest.params = { eventId: '1', zoneId: '1' };

      await deleteZone(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
    });
  });
});
