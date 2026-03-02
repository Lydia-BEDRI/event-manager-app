/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { 
  getAllParticipations,
  getParticipationsByEvent
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
});
