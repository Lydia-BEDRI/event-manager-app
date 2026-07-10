/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { 
  getAllParticipations,
  getParticipationsByEvent,
  getMyParticipantStats,
  updateParticipationStatus,
  requestEventParticipation,
  getMyQrCodes,
  generateParticipationQrCode,
  verifyAccessScan
} from '../participation.service';
import { api } from '../api';
import { verifyAccessToken } from '../access.service';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));
jest.mock('../access.service', () => ({
  verifyAccessToken: jest.fn(),
}));

describe('Participation Service', () => {
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('accessToken', mockAccessToken);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getAllParticipations', () => {
    it('devrait récupérer toutes les participations avec succès', async () => {
      const mockParticipations = [
        {
          id: 1,
          user_id: 1,
          event_id: 1,
          status: 'APPROVED' as const,
          qr_code: 'QR123',
          created_at: '2026-01-15T10:00:00Z',
          approved_at: '2026-01-16T10:00:00Z',
          email: 'user1@test.com',
          first_name: 'John',
          last_name: 'Doe',
          event_name: 'Event Test 1',
          event_location: 'Paris',
          event_start_date: '2026-05-01T10:00:00Z',
          approved_by_first_name: 'Admin',
          approved_by_last_name: 'User'
        },
        {
          id: 2,
          user_id: 2,
          event_id: 1,
          status: 'PENDING' as const,
          qr_code: null,
          created_at: '2026-01-17T10:00:00Z',
          approved_at: null,
          email: 'user2@test.com',
          first_name: 'Jane',
          last_name: 'Smith',
          event_name: 'Event Test 1',
          event_location: 'Paris',
          event_start_date: '2026-05-01T10:00:00Z',
          approved_by_first_name: null,
          approved_by_last_name: null
        },
        {
          id: 3,
          user_id: 3,
          event_id: 2,
          status: 'REFUSED' as const,
          qr_code: null,
          created_at: '2026-01-18T10:00:00Z',
          approved_at: '2026-01-19T10:00:00Z',
          email: 'user3@test.com',
          first_name: 'Bob',
          last_name: 'Johnson',
          event_name: 'Event Test 2',
          event_location: 'Lyon',
          event_start_date: '2026-06-01T10:00:00Z',
          approved_by_first_name: 'Admin',
          approved_by_last_name: 'User'
        }
      ];

      (api.get as jest.Mock).mockResolvedValueOnce(mockParticipations);

      const result = await getAllParticipations();

      expect(api.get).toHaveBeenCalledWith('/participations', mockAccessToken);
      expect(result).toEqual(mockParticipations);
      expect(result).toHaveLength(3);
    });

    it('devrait retourner un tableau vide si aucune participation', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce([]);

      const result = await getAllParticipations();

      expect(api.get).toHaveBeenCalledWith('/participations', mockAccessToken);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      await expect(getAllParticipations()).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
      expect(api.get).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(getAllParticipations()).rejects.toThrow('Network error');
    });
  });

  describe('getParticipationsByEvent', () => {
    it('devrait récupérer les participations d\'un événement spécifique', async () => {
      const mockParticipations = [
        {
          id: 1,
          user_id: 1,
          event_id: 1,
          status: 'APPROVED' as const,
          qr_code: 'QR123',
          created_at: '2026-01-15T10:00:00Z',
          approved_at: '2026-01-16T10:00:00Z',
          email: 'user1@test.com',
          first_name: 'John',
          last_name: 'Doe',
          event_name: 'Event Test 1',
          event_location: 'Paris',
          event_start_date: '2026-05-01T10:00:00Z',
          approved_by_first_name: 'Admin',
          approved_by_last_name: 'User'
        },
        {
          id: 2,
          user_id: 2,
          event_id: 1,
          status: 'PENDING' as const,
          qr_code: null,
          created_at: '2026-01-17T10:00:00Z',
          approved_at: null,
          email: 'user2@test.com',
          first_name: 'Jane',
          last_name: 'Smith',
          event_name: 'Event Test 1',
          event_location: 'Paris',
          event_start_date: '2026-05-01T10:00:00Z',
          approved_by_first_name: null,
          approved_by_last_name: null
        }
      ];

      (api.get as jest.Mock).mockResolvedValueOnce(mockParticipations);

      const result = await getParticipationsByEvent(1);

      expect(api.get).toHaveBeenCalledWith('/participations/event/1', mockAccessToken);
      expect(result).toEqual(mockParticipations);
      expect(result).toHaveLength(2);
      expect(result.every(p => p.event_id === 1)).toBe(true);
    });

    it('devrait retourner un tableau vide si l\'événement n\'a pas de participants', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce([]);

      const result = await getParticipationsByEvent(999);

      expect(api.get).toHaveBeenCalledWith('/participations/event/999', mockAccessToken);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      await expect(getParticipationsByEvent(1)).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
      expect(api.get).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(getParticipationsByEvent(1)).rejects.toThrow('Network error');
    });

    it('devrait gérer différents eventId', async () => {
      const mockParticipations42 = [
        {
          id: 5,
          user_id: 5,
          event_id: 42,
          status: 'APPROVED' as const,
          qr_code: 'QR999',
          created_at: '2026-02-01T10:00:00Z',
          approved_at: '2026-02-02T10:00:00Z',
          email: 'specific@test.com',
          first_name: 'Specific',
          last_name: 'User',
          event_name: 'Specific Event',
          event_location: 'Marseille',
          event_start_date: '2026-07-01T10:00:00Z',
          approved_by_first_name: 'Admin',
          approved_by_last_name: 'User'
        }
      ];

      (api.get as jest.Mock).mockResolvedValueOnce(mockParticipations42);

      const result = await getParticipationsByEvent(42);

      expect(api.get).toHaveBeenCalledWith('/participations/event/42', mockAccessToken);
      expect(result).toEqual(mockParticipations42);
      expect(result[0].event_id).toBe(42);
    });
  });

  describe('getMyParticipantStats', () => {
    it('devrait récupérer les statistiques du participant avec succès', async () => {
      const mockStats = {
        stats: {
          total_participations: 5,
          approved_participations: 3,
          pending_participations: 1,
          refused_participations: 1,
        },
        zoneAccess: [
          {
            zone_id: 1,
            zone_name: 'Zone VIP',
            event_name: 'Conférence Tech 2026',
            event_start_date: '2026-05-01T10:00:00Z',
            access_granted: true,
          },
        ],
        myParticipations: [
          {
            id: 1,
            event_id: 1,
            event_name: 'Conférence Tech 2026',
            event_location: 'Paris',
            event_start_date: '2026-05-01T10:00:00Z',
            status: 'APPROVED' as const,
            qr_code: 'QR123456',
            zone_count: 2,
          },
        ],
        availableEvents: [
          {
            id: 4,
            name: 'Conférence Cybersécurité',
            location: 'Toulouse',
            start_date: '2026-07-01T10:00:00Z',
            end_date: '2026-07-01T18:00:00Z',
            total_capacity: 200,
            available_places: 50,
          },
        ],
        upcomingEvents: [
          {
            id: 1,
            name: 'Conférence Tech 2026',
            location: 'Paris',
            start_date: '2026-05-01T10:00:00Z',
            end_date: '2026-05-01T18:00:00Z',
            qr_code: 'QR123456',
          },
        ],
        pastEvents: [
          {
            id: 6,
            name: 'Meetup JavaScript',
            location: 'Bordeaux',
            start_date: '2026-02-10T19:00:00Z',
            end_date: '2026-02-10T22:00:00Z',
            zone_count: 1,
          },
        ],
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockStats);

      const result = await getMyParticipantStats();

      expect(api.get).toHaveBeenCalledWith('/participations/my-stats', mockAccessToken);
      expect(result).toEqual(mockStats);
      expect(result.stats.total_participations).toBe(5);
      expect(result.stats.approved_participations).toBe(3);
      expect(result.myParticipations).toHaveLength(1);
      expect(result.availableEvents).toHaveLength(1);
    });

    it('devrait retourner des statistiques vides pour un nouveau participant', async () => {
      const emptyStats = {
        stats: {
          total_participations: 0,
          approved_participations: 0,
          pending_participations: 0,
          refused_participations: 0,
        },
        zoneAccess: [],
        myParticipations: [],
        availableEvents: [],
        upcomingEvents: [],
        pastEvents: [],
      };

      (api.get as jest.Mock).mockResolvedValueOnce(emptyStats);

      const result = await getMyParticipantStats();

      expect(api.get).toHaveBeenCalledWith('/participations/my-stats', mockAccessToken);
      expect(result.stats.total_participations).toBe(0);
      expect(result.myParticipations).toHaveLength(0);
      expect(result.availableEvents).toHaveLength(0);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      await expect(getMyParticipantStats()).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
      expect(api.get).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(getMyParticipantStats()).rejects.toThrow('Network error');
    });

    it('devrait inclure tous les types de statistiques', async () => {
      const completeStats = {
        stats: {
          total_participations: 10,
          approved_participations: 6,
          pending_participations: 2,
          refused_participations: 2,
        },
        zoneAccess: [
          {
            zone_id: 1,
            zone_name: 'Zone A',
            event_name: 'Event A',
            event_start_date: '2026-05-01T10:00:00Z',
            access_granted: true,
          },
          {
            zone_id: 2,
            zone_name: 'Zone B',
            event_name: 'Event B',
            event_start_date: '2026-06-01T10:00:00Z',
            access_granted: false,
          },
        ],
        myParticipations: [
          {
            id: 1,
            event_id: 1,
            event_name: 'Event 1',
            event_location: 'Location 1',
            event_start_date: '2026-05-01T10:00:00Z',
            status: 'APPROVED' as const,
            qr_code: 'QR1',
            zone_count: 3,
          },
          {
            id: 2,
            event_id: 2,
            event_name: 'Event 2',
            event_location: 'Location 2',
            event_start_date: '2026-06-01T10:00:00Z',
            status: 'PENDING' as const,
            qr_code: null,
            zone_count: 1,
          },
        ],
        availableEvents: [
          {
            id: 3,
            name: 'Available Event',
            location: 'Location 3',
            start_date: '2026-07-01T10:00:00Z',
            end_date: '2026-07-01T18:00:00Z',
            total_capacity: 100,
            available_places: 50,
          },
        ],
        upcomingEvents: [
          {
            id: 1,
            name: 'Upcoming Event',
            location: 'Location 4',
            start_date: '2026-08-01T10:00:00Z',
            end_date: '2026-08-01T18:00:00Z',
            qr_code: 'QR2',
          },
        ],
        pastEvents: [
          {
            id: 5,
            name: 'Past Event',
            location: 'Location 5',
            start_date: '2026-01-01T10:00:00Z',
            end_date: '2026-01-01T18:00:00Z',
            zone_count: 2,
          },
        ],
      };

      (api.get as jest.Mock).mockResolvedValueOnce(completeStats);

      const result = await getMyParticipantStats();

      expect(result.stats).toBeDefined();
      expect(result.zoneAccess).toBeDefined();
      expect(result.myParticipations).toBeDefined();
      expect(result.availableEvents).toBeDefined();
      expect(result.upcomingEvents).toBeDefined();
      expect(result.pastEvents).toBeDefined();
      expect(result.zoneAccess).toHaveLength(2);
      expect(result.myParticipations).toHaveLength(2);
    });
  });

  describe('requestEventParticipation', () => {
    it('devrait envoyer une demande de participation', async () => {
      const mockParticipation = { id: 8, event_id: 12, status: 'PENDING' };
      (api.post as jest.Mock).mockResolvedValueOnce(mockParticipation);

      const result = await requestEventParticipation(12);

      expect(api.post).toHaveBeenCalledWith('/participations/events/12/request', {}, mockAccessToken);
      expect(result).toEqual(mockParticipation);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      await expect(requestEventParticipation(12)).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  describe('updateParticipationStatus', () => {
    it('devrait mettre à jour le statut d’une participation', async () => {
      const mockParticipation = {
        id: 4,
        user_id: 3,
        event_id: 1,
        status: 'APPROVED' as const,
        qr_code: 'QR123',
        created_at: '2026-01-15T10:00:00Z',
        approved_at: '2026-01-16T10:00:00Z',
        email: 'participant@test.com',
        first_name: 'Charlie',
        last_name: 'Durand',
        event_name: 'Conférence Tech 2026',
        event_location: 'Paris',
        event_start_date: '2026-05-01T10:00:00Z',
        approved_by_first_name: 'Alice',
        approved_by_last_name: 'Martin',
      };
      (api.patch as jest.Mock).mockResolvedValueOnce(mockParticipation);

      const result = await updateParticipationStatus(4, 'APPROVED');

      expect(api.patch).toHaveBeenCalledWith('/participations/4/status', { status: 'APPROVED' }, mockAccessToken);
      expect(result).toEqual(mockParticipation);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      await expect(updateParticipationStatus(4, 'REFUSED')).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
      expect(api.patch).not.toHaveBeenCalled();
    });
  });

  describe('getMyQrCodes', () => {
    it('devrait récupérer les QR codes du participant', async () => {
      const mockQrCodes = [
        {
          id: 1,
          event_id: 4,
          qr_code: 'QR-EVT4-USR1',
          qr_code_data: 'data:image/png;base64,abc',
          event_name: 'Forum Innovation',
          event_location: 'Nice',
          event_start_date: '2026-08-15T09:00:00Z',
          event_end_date: '2026-08-15T17:00:00Z',
        },
      ];
      (api.get as jest.Mock).mockResolvedValueOnce(mockQrCodes);

      const result = await getMyQrCodes();

      expect(api.get).toHaveBeenCalledWith('/participations/my-qr-codes', mockAccessToken);
      expect(result).toEqual(mockQrCodes);
    });
  });

  describe('generateParticipationQrCode', () => {
    it('devrait générer un QR code pour une participation', async () => {
      const mockQrCode = { id: 3, qr_code: 'QR-GENERATED', qr_code_data: 'data:image/png;base64,xyz' };
      (api.post as jest.Mock).mockResolvedValueOnce(mockQrCode);

      const result = await generateParticipationQrCode(3);

      expect(api.post).toHaveBeenCalledWith('/participations/3/qr-code', {}, mockAccessToken);
      expect(result).toEqual(mockQrCode);
    });
  });

  describe('verifyAccessScan', () => {
    it('devrait vérifier un passage via la route access', async () => {
      const mockResult = {
        id: 20,
        is_valid: true,
        participant_name: 'Charlie Durand',
        event_name: 'Conférence Tech 2026',
        zone_name: 'Hall Principal',
        scanned_at: '2026-06-23T10:00:00Z',
      };
      (verifyAccessToken as jest.Mock).mockResolvedValueOnce(mockResult);

      const result = await verifyAccessScan('QR-EVT1-USR3', 1);

      expect(verifyAccessToken).toHaveBeenCalledWith({ token: 'QR-EVT1-USR3', zoneId: 1 });
      expect(result).toEqual(mockResult);
    });
  });
});
