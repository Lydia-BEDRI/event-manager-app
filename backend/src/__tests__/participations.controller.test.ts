import { Request, Response } from 'express';
import { 
  getAllParticipations,
  getParticipationsByEvent,
  getMyParticipantStats,
  updateParticipationStatus
} from '../controllers/participations.controller';
import pool from '../config/database';
import { AuthenticatedRequest } from '../middlewares/authenticate';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    getConnection: jest.fn(),
  },
}));

describe('Participations Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;
  let mockConnection: any;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {};
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };

    mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
      query: jest.fn(),
    };
    (pool.getConnection as jest.Mock).mockResolvedValue(mockConnection);
    
    jest.clearAllMocks();
    (pool.getConnection as jest.Mock).mockResolvedValue(mockConnection);
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
        expect.stringContaining('SELECT')
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

  describe('updateParticipationStatus', () => {
    it('devrait approuver une participation, générer le QR code et accorder les accès zones', async () => {
      const mockAuthRequest = {
        params: { participationId: '12' },
        body: { status: 'APPROVED' },
        user: { userId: 1, email: 'admin@test.com', role: 'ADMIN' },
        ip: '127.0.0.1'
      };

      const updatedParticipation = {
        id: 12,
        user_id: 3,
        event_id: 8,
        status: 'APPROVED',
        qr_code: 'QR-EVT8-USR3',
        created_at: new Date('2026-01-15'),
        approved_at: new Date('2026-01-16'),
        email: 'participant@test.com',
        first_name: 'Charlie',
        last_name: 'Durand',
        event_name: 'Conférence Tech 2026',
        event_location: 'Paris',
        event_start_date: new Date('2026-05-01'),
        approved_by_first_name: 'Alice',
        approved_by_last_name: 'Martin'
      };

      mockConnection.query
        .mockResolvedValueOnce([[{
          id: 12,
          user_id: 3,
          event_id: 8,
          status: 'PENDING',
          qr_code: null,
          capacity: 100,
          event_name: 'Conférence Tech 2026',
          approved_count: 20
        }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([[updatedParticipation]]);

      await updateParticipationStatus(
        mockAuthRequest as unknown as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT IGNORE INTO zone_access'),
        [12, 8]
      );
      expect(responseJson).toHaveBeenCalledWith(updatedParticipation);
    });

    it('devrait refuser un statut invalide', async () => {
      const mockAuthRequest = {
        params: { participationId: '12' },
        body: { status: 'PENDING' },
        user: { userId: 1, email: 'admin@test.com', role: 'ADMIN' },
      };

      await updateParticipationStatus(
        mockAuthRequest as unknown as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Statut invalide' });
      expect(mockConnection.beginTransaction).not.toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('getMyParticipantStats', () => {
    let mockAuthRequest: Partial<AuthenticatedRequest>;

    beforeEach(() => {
      mockAuthRequest = {
        user: {
          userId: 1,
          email: 'participant@test.com',
          role: 'PARTICIPANT'
        }
      };
    });

    it('devrait récupérer les statistiques complètes du participant', async () => {
      const mockParticipationStats = [{
        total_participations: 5,
        approved_participations: 3,
        pending_participations: 1,
        refused_participations: 1
      }];

      const mockMyParticipations = [
        {
          id: 1,
          status: 'APPROVED',
          qr_code: 'QR123',
          created_at: new Date('2026-01-15'),
          approved_at: new Date('2026-01-16'),
          event_id: 1,
          event_name: 'Conférence Tech',
          event_location: 'Paris',
          event_start_date: new Date('2026-05-01'),
          event_end_date: new Date('2026-05-01'),
          event_capacity: 100,
          event_status: 'PUBLISHED'
        }
      ];

      const mockAvailableEvents = [
        {
          id: 2,
          name: 'Workshop React',
          description: 'Un atelier sur React',
          location: 'Lyon',
          start_date: new Date('2026-06-01'),
          end_date: new Date('2026-06-01'),
          capacity: 50,
          status: 'PUBLISHED',
          current_participants: 20
        }
      ];

      const mockZoneAccessStats = [{
        unique_zones_visited: 3,
        total_zone_accesses: 10
      }];

      const mockUpcomingEvents = [
        {
          id: 1,
          name: 'Conférence Tech',
          location: 'Paris',
          start_date: new Date('2026-05-01'),
          end_date: new Date('2026-05-01'),
          status: 'APPROVED',
          qr_code: 'QR123'
        }
      ];

      const mockPastEvents = [
        {
          id: 3,
          name: 'Meetup JavaScript',
          location: 'Marseille',
          start_date: new Date('2026-02-01'),
          end_date: new Date('2026-02-01'),
          status: 'APPROVED',
          zones_visited: 2
        }
      ];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockParticipationStats])
        .mockResolvedValueOnce([mockMyParticipations])
        .mockResolvedValueOnce([mockAvailableEvents])
        .mockResolvedValueOnce([mockZoneAccessStats])
        .mockResolvedValueOnce([mockUpcomingEvents])
        .mockResolvedValueOnce([mockPastEvents]);

      await getMyParticipantStats(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(pool.query).toHaveBeenCalledTimes(6);
      expect(responseJson).toHaveBeenCalledWith({
        stats: mockParticipationStats[0],
        zoneAccess: mockZoneAccessStats[0],
        myParticipations: mockMyParticipations,
        availableEvents: mockAvailableEvents,
        upcomingEvents: mockUpcomingEvents,
        pastEvents: mockPastEvents
      });
    });

    it('devrait retourner des statistiques vides pour un nouveau participant', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[{
          total_participations: '0',
          approved_participations: null,
          pending_participations: null,
          refused_participations: null
        }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{
          unique_zones_visited: '0',
          total_zone_accesses: '0'
        }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      await getMyParticipantStats(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        stats: {
          total_participations: 0,
          approved_participations: 0,
          pending_participations: 0,
          refused_participations: 0
        },
        zoneAccess: {
          unique_zones_visited: 0,
          total_zone_accesses: 0
        },
        myParticipations: [],
        availableEvents: [],
        upcomingEvents: [],
        pastEvents: []
      });
    });

    it('devrait retourner 401 si l\'utilisateur n\'est pas authentifié', async () => {
      mockAuthRequest.user = undefined;

      await getMyParticipantStats(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Non authentifié' });
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de base de données', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      await getMyParticipantStats(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Erreur serveur'
        })
      );
    });

    it('devrait filtrer correctement par userId', async () => {
      mockAuthRequest.user = {
        userId: 42,
        email: 'specific@test.com',
        role: 'PARTICIPANT'
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[{ total_participations: 2, approved_participations: 2, pending_participations: 0, refused_participations: 0 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ unique_zones_visited: 1, total_zone_accesses: 3 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      await getMyParticipantStats(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      // Vérifie que toutes les requêtes ont été appelées avec le bon userId
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = ?'),
        [42]
      );
    });

    it('devrait inclure le nombre de zones visitées dans les événements passés', async () => {
      const mockPastEventsWithZones = [
        {
          id: 1,
          name: 'Event passé 1',
          location: 'Paris',
          start_date: new Date('2026-01-01'),
          end_date: new Date('2026-01-01'),
          status: 'APPROVED',
          zones_visited: 5
        },
        {
          id: 2,
          name: 'Event passé 2',
          location: 'Lyon',
          start_date: new Date('2026-01-15'),
          end_date: new Date('2026-01-15'),
          status: 'APPROVED',
          zones_visited: 3
        }
      ];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[{ total_participations: 2, approved_participations: 2, pending_participations: 0, refused_participations: 0 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ unique_zones_visited: 5, total_zone_accesses: 8 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([mockPastEventsWithZones]);

      await getMyParticipantStats(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          pastEvents: mockPastEventsWithZones
        })
      );
    });

    it('devrait filtrer les événements disponibles pour ne pas inclure ceux déjà inscrits', async () => {
      const mockAvailableEvents = [
        {
          id: 5,
          name: 'Nouvel événement',
          description: 'Disponible',
          location: 'Toulouse',
          start_date: new Date('2026-07-01'),
          end_date: new Date('2026-07-01'),
          capacity: 100,
          status: 'PUBLISHED',
          current_participants: 25
        }
      ];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[{ total_participations: 3, approved_participations: 3, pending_participations: 0, refused_participations: 0 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([mockAvailableEvents])
        .mockResolvedValueOnce([[{ unique_zones_visited: 2, total_zone_accesses: 5 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      await getMyParticipantStats(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('NOT IN'),
        [mockAuthRequest.user?.userId]
      );
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          availableEvents: mockAvailableEvents
        })
      );
    });

    it('devrait retourner toutes les participations détaillées', async () => {
      const mockManyParticipations = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        status: 'APPROVED',
        qr_code: `QR${i}`,
        created_at: new Date('2026-01-15'),
        approved_at: new Date('2026-01-16'),
        event_id: i + 1,
        event_name: `Event ${i}`,
        event_location: 'Paris',
        event_start_date: new Date('2026-05-01'),
        event_end_date: new Date('2026-05-01'),
        event_capacity: 100,
        event_status: 'PUBLISHED'
      }));

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[{ total_participations: 15, approved_participations: 15, pending_participations: 0, refused_participations: 0 }]])
        .mockResolvedValueOnce([mockManyParticipations])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ unique_zones_visited: 5, total_zone_accesses: 20 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      await getMyParticipantStats(mockAuthRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        myParticipations: mockManyParticipations
      }));
    });
  });
});
