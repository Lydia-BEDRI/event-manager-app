/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { 
  getAllParticipations,
  getParticipationsByEvent,
  getMyParticipantStats
} from '../participation.service';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
  },
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
});
