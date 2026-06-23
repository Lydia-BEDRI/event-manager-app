/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { 
  getAllZones,
  getDistinctZones,
  getEventZones,
  createZone,
  updateZone,
  deleteZone,
  getZoneById
} from '../zone.service';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Zone Service', () => {
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('accessToken', mockAccessToken);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getAllZones', () => {
    it('devrait récupérer toutes les zones avec succès', async () => {
      const mockZones = [
        {
          id: 1,
          event_id: 1,
          name: 'Zone VIP',
          description: 'Zone pour invités VIP',
          capacity: 50,
          created_at: '2026-01-15T10:00:00Z',
          event_name: 'Event Test'
        },
        {
          id: 2,
          event_id: 1,
          name: 'Zone Standard',
          description: 'Zone standard',
          capacity: 100,
          created_at: '2026-01-15T10:00:00Z',
          event_name: 'Event Test'
        }
      ];

      (api.get as jest.Mock).mockResolvedValueOnce(mockZones);

      const result = await getAllZones();

      expect(api.get).toHaveBeenCalledWith('/zones', mockAccessToken);
      expect(result).toEqual(mockZones);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      await expect(getAllZones()).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
    });
  });

  describe('getDistinctZones', () => {
    it('devrait récupérer les zones distinctes', async () => {
      const mockZones = [
        { name: 'Zone VIP', description: 'Zone VIP', capacity: 50 },
        { name: 'Zone Standard', description: 'Zone Standard', capacity: 100 }
      ];

      (api.get as jest.Mock).mockResolvedValueOnce(mockZones);

      const result = await getDistinctZones();

      expect(api.get).toHaveBeenCalledWith('/zones/distinct', mockAccessToken);
      expect(result).toEqual(mockZones);
    });
  });

  describe('getEventZones', () => {
    it('devrait récupérer les zones d\'un événement', async () => {
      const mockZones = [
        { id: 1, event_id: 1, name: 'Zone A', capacity: 50 },
        { id: 2, event_id: 1, name: 'Zone B', capacity: 100 }
      ];

      (api.get as jest.Mock).mockResolvedValueOnce(mockZones);

      const result = await getEventZones(1);

      expect(api.get).toHaveBeenCalledWith('/zones/event/1', mockAccessToken);
      expect(result).toEqual(mockZones);
    });
  });

  describe('createZone', () => {
    it('devrait créer une zone avec succès', async () => {
      const zoneData = {
        name: 'Zone VIP',
        description: 'Zone pour invités VIP',
        capacity: 50
      };

      const mockResponse = {
        id: 1,
        event_id: 1,
        ...zoneData,
        created_at: '2026-01-15T10:00:00Z'
      };

      (api.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await createZone(1, zoneData);

      expect(api.post).toHaveBeenCalledWith('/zones/1/zones', zoneData, mockAccessToken);
      expect(result).toEqual(mockResponse);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      const zoneData = {
        name: 'Zone Test',
        capacity: 50
      };

      await expect(createZone(1, zoneData)).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
    });
  });

  describe('updateZone', () => {
    it('devrait mettre à jour une zone avec succès', async () => {
      const updateData = {
        name: 'Zone VIP Updated',
        capacity: 60
      };

      const mockResponse = {
        id: 1,
        event_id: 1,
        name: 'Zone VIP Updated',
        description: 'Zone pour invités VIP',
        capacity: 60,
        created_at: '2026-01-15T10:00:00Z'
      };

      (api.put as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await updateZone(1, 1, updateData);

      expect(api.put).toHaveBeenCalledWith('/zones/1/zones/1', updateData, mockAccessToken);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteZone', () => {
    it('devrait supprimer une zone avec succès', async () => {
      const mockResponse = { message: 'Zone supprimée avec succès' };

      (api.delete as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await deleteZone(1, 1);

      expect(api.delete).toHaveBeenCalledWith('/zones/1/zones/1', mockAccessToken);
      expect(result).toEqual(mockResponse);
    });

    it('devrait lever une erreur si le token est manquant', async () => {
      localStorage.removeItem('accessToken');

      await expect(deleteZone(1, 1)).rejects.toThrow('Token manquant. Veuillez vous reconnecter.');
    });
  });

  describe('getZoneById', () => {
    it('devrait récupérer une zone par ID', async () => {
      const mockZones = [
        { id: 1, name: 'Zone A', capacity: 50 },
        { id: 2, name: 'Zone B', capacity: 100 }
      ];

      (api.get as jest.Mock).mockResolvedValueOnce(mockZones);

      const result = await getZoneById(1);

      expect(api.get).toHaveBeenCalledWith('/zones', mockAccessToken);
      expect(result).toEqual(mockZones[0]);
    });

    it('devrait retourner undefined si la zone n\'existe pas', async () => {
      const mockZones = [
        { id: 2, name: 'Zone B', capacity: 100 }
      ];

      (api.get as jest.Mock).mockResolvedValueOnce(mockZones);

      const result = await getZoneById(999);

      expect(result).toBeUndefined();
    });
  });
});
