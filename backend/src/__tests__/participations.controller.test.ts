import { Request, Response } from 'express';
import { 
  getAllParticipations,
  getParticipationsByEvent
} from '../controllers/participations.controller';
import pool from '../config/database';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Participations Controller', () => {
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

  describe('getAllParticipations', () => {
    it('ca doit récupérer toutes les participations avec succès', async () => {
      const mockParticipations = [
        {
          id: 1,
          user_id: 1,
          event_id: 1,
          status: 'APPROVED',
          qr_code: 'QR123',
          created_at: new Date('2026-01-15'),
          approved_at: new Date('2026-01-16'),
          email: 'user1@test.com',
          first_name: 'John',
          last_name: 'Doe',
          event_name: 'Event Test 1',
          event_location: 'Paris',
          event_start_date: new Date('2026-05-01'),
          approved_by_first_name: 'Admin',
          approved_by_last_name: 'User'
        },
        {
          id: 2,
          user_id: 2,
          event_id: 1,
          status: 'PENDING',
          qr_code: null,
          created_at: new Date('2026-01-17'),
          approved_at: null,
          email: 'user2@test.com',
          first_name: 'Jane',
          last_name: 'Smith',
          event_name: 'Event Test 1',
          event_location: 'Paris',
          event_start_date: new Date('2026-05-01'),
          approved_by_first_name: null,
          approved_by_last_name: null
        },
        {
          id: 3,
          user_id: 3,
          event_id: 2,
          status: 'REFUSED',
          qr_code: null,
          created_at: new Date('2026-01-18'),
          approved_at: new Date('2026-01-19'),
          email: 'user3@test.com',
          first_name: 'Bob',
          last_name: 'Johnson',
          event_name: 'Event Test 2',
          event_location: 'Lyon',
          event_start_date: new Date('2026-06-01'),
          approved_by_first_name: 'Admin',
          approved_by_last_name: 'User'
        }
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockParticipations]);

      await getAllParticipations(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        undefined
      );
      expect(responseJson).toHaveBeenCalledWith(mockParticipations);
    });

    it('devrait retourner un tableau vide si aucune participation', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      await getAllParticipations(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith([]);
    });

    it('devrait gérer les erreurs serveur', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await getAllParticipations(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erreur serveur'
        })
      );
    });
  });

  describe('getParticipationsByEvent', () => {
    it('devrait récupérer les participations d\'un événement spécifique', async () => {
      const mockParticipations = [
        {
          id: 1,
          user_id: 1,
          event_id: 1,
          status: 'APPROVED',
          qr_code: 'QR123',
          created_at: new Date('2026-01-15'),
          approved_at: new Date('2026-01-16'),
          email: 'user1@test.com',
          first_name: 'John',
          last_name: 'Doe',
          event_name: 'Event Test 1',
          event_location: 'Paris',
          event_start_date: new Date('2026-05-01'),
          approved_by_first_name: 'Admin',
          approved_by_last_name: 'User'
        },
        {
          id: 2,
          user_id: 2,
          event_id: 1,
          status: 'PENDING',
          qr_code: null,
          created_at: new Date('2026-01-17'),
          approved_at: null,
          email: 'user2@test.com',
          first_name: 'Jane',
          last_name: 'Smith',
          event_name: 'Event Test 1',
          event_location: 'Paris',
          event_start_date: new Date('2026-05-01'),
          approved_by_first_name: null,
          approved_by_last_name: null
        }
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockParticipations]);

      mockRequest.params = { eventId: '1' };

      await getParticipationsByEvent(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.event_id = ?'),
        ['1']
      );
      expect(responseJson).toHaveBeenCalledWith(mockParticipations);
    });

    it('devrait retourner un tableau vide si l\'événement n\'a pas de participants', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      mockRequest.params = { eventId: '999' };

      await getParticipationsByEvent(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith([]);
    });

    it('devrait gérer les erreurs serveur', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      mockRequest.params = { eventId: '1' };

      await getParticipationsByEvent(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erreur serveur'
        })
      );
    });

    it('devrait filtrer correctement par eventId', async () => {
      const mockParticipations = [
        {
          id: 5,
          user_id: 5,
          event_id: 42,
          status: 'APPROVED',
          qr_code: 'QR999',
          created_at: new Date('2026-02-01'),
          approved_at: new Date('2026-02-02'),
          email: 'specific@test.com',
          first_name: 'Specific',
          last_name: 'User',
          event_name: 'Specific Event',
          event_location: 'Marseille',
          event_start_date: new Date('2026-07-01'),
          approved_by_first_name: 'Admin',
          approved_by_last_name: 'User'
        }
      ];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockParticipations]);

      mockRequest.params = { eventId: '42' };

      await getParticipationsByEvent(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.event_id = ?'),
        ['42']
      );
      expect(responseJson).toHaveBeenCalledWith(mockParticipations);
    });
  });
});
