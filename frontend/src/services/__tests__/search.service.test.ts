/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { searchService } from '../search.service';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Search Service', () => {
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('globalSearch()', () => {
    it('devrait retourner les résultats de recherche globale', async () => {
      const mockResponse = {
        data: {
          query: 'test',
          totalResults: 4,
          results: [
            {
              type: 'event',
              id: 1,
              title: 'Conférence Test',
              description: 'Une conférence de test',
              relevance: 100,
            },
            {
              type: 'user',
              id: 2,
              title: 'Jean Dupont',
              description: 'jean.dupont@example.com',
              relevance: 85,
            },
            {
              type: 'zone',
              id: 3,
              title: 'Zone Test',
              description: 'Une zone pour tester',
              relevance: 75,
            },
            {
              type: 'message',
              id: 4,
              title: 'Message de test',
              description: 'Ceci est un message de test',
              relevance: 60,
            },
          ],
          summary: {
            events: 1,
            users: 1,
            zones: 1,
            messages: 1,
          },
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchService.globalSearch('test', 5, 0, mockAccessToken);

      expect(api.get).toHaveBeenCalledWith(
        '/search?q=test&limit=5&offset=0',
        mockAccessToken
      );
      expect(result.query).toBe('test');
      expect(result.totalResults).toBe(4);
      expect(result.results).toHaveLength(4);
      expect(result.summary.events).toBe(1);
      expect(result.summary.users).toBe(1);
      expect(result.summary.zones).toBe(1);
      expect(result.summary.messages).toBe(1);
    });

    it('devrait retourner un résultat vide pour une recherche sans résultats', async () => {
      const mockResponse = {
        data: {
          query: 'xyzabc123notexist',
          totalResults: 0,
          results: [],
          summary: {
            events: 0,
            users: 0,
            zones: 0,
            messages: 0,
          },
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchService.globalSearch('xyzabc123notexist', 5, 0, mockAccessToken);

      expect(result.totalResults).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('devrait respecter les paramètres limit et offset', async () => {
      const mockResponse = {
        data: {
          query: 'event',
          totalResults: 10,
          results: [],
          summary: { events: 10, users: 0, zones: 0, messages: 0 },
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      await searchService.globalSearch('event', 20, 10, mockAccessToken);

      expect(api.get).toHaveBeenCalledWith(
        '/search?q=event&limit=20&offset=10',
        mockAccessToken
      );
    });

    it('devrait utiliser les valeurs par défaut si limit et offset ne sont pas fournis', async () => {
      const mockResponse = {
        data: {
          query: 'test',
          totalResults: 0,
          results: [],
          summary: { events: 0, users: 0, zones: 0, messages: 0 },
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      await searchService.globalSearch('test', undefined, undefined, mockAccessToken);

      expect(api.get).toHaveBeenCalledWith(
        '/search?q=test&limit=5&offset=0',
        mockAccessToken
      );
    });
  });

  describe('searchByType()', () => {
    it('devrait rechercher les événements correctement', async () => {
      const mockResponse = {
        data: {
          type: 'event',
          query: 'conference',
          totalResults: 2,
          results: [
            {
              type: 'event',
              id: 1,
              title: 'Conférence Tech 2026',
              description: 'Une conférence sur les technologies',
              relevance: 100,
            },
            {
              type: 'event',
              id: 2,
              title: 'Conférence IA',
              description: 'Intelligence Artificielle',
              relevance: 90,
            },
          ],
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchService.searchByType('event', 'conference', 10, mockAccessToken);

      expect(api.get).toHaveBeenCalledWith(
        '/search/by-type/event?q=conference&limit=10',
        mockAccessToken
      );
      expect(result.type).toBe('event');
      expect(result.results).toHaveLength(2);
      expect(result.results[0].type).toBe('event');
    });

    it('devrait rechercher les utilisateurs correctement', async () => {
      const mockResponse = {
        data: {
          type: 'user',
          query: 'jean',
          totalResults: 1,
          results: [
            {
              type: 'user',
              id: 1,
              title: 'Jean Dupont',
              description: 'jean.dupont@example.com',
              relevance: 100,
            },
          ],
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchService.searchByType('user', 'jean', 10, mockAccessToken);

      expect(result.type).toBe('user');
      expect(result.results[0].type).toBe('user');
    });

    it('devrait rechercher les zones correctement', async () => {
      const mockResponse = {
        data: {
          type: 'zone',
          query: 'paris',
          totalResults: 1,
          results: [
            {
              type: 'zone',
              id: 1,
              title: 'Paris - La Défense',
              description: 'Zone principale de Paris',
              relevance: 100,
            },
          ],
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchService.searchByType('zone', 'paris', 10, mockAccessToken);

      expect(result.type).toBe('zone');
      expect(result.results[0].type).toBe('zone');
    });

    it('devrait rechercher les messages correctement', async () => {
      const mockResponse = {
        data: {
          type: 'message',
          query: 'hello',
          totalResults: 1,
          results: [
            {
              type: 'message',
              id: 1,
              title: 'Hello message',
              description: 'Hello world!',
              relevance: 100,
            },
          ],
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await searchService.searchByType('message', 'hello', 10, mockAccessToken);

      expect(result.type).toBe('message');
      expect(result.results[0].type).toBe('message');
    });
  });

  describe('advancedSearch()', () => {
    it('devrait chercher avec des filtres', async () => {
      const mockResponse = {
        data: {
          query: 'test',
          totalResults: 1,
          results: [
            {
              type: 'event',
              id: 1,
              title: 'Test Event',
              description: 'An event for testing',
              relevance: 100,
            },
          ],
          filters: {
            type: 'event',
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const params = {
        query: 'test',
        filters: { type: 'event' },
        limit: 10,
      };

      const result = await searchService.advancedSearch(params, mockAccessToken);

      expect(api.post).toHaveBeenCalledWith('/search/advanced', params, mockAccessToken);
      expect(result.query).toBe('test');
      expect(result.results).toHaveLength(1);
      expect(result.filters.type).toBe('event');
    });

    it('devrait chercher avec un filtre eventId', async () => {
      const mockResponse = {
        data: {
          query: 'zone',
          totalResults: 1,
          results: [
            {
              type: 'zone',
              id: 1,
              title: 'Zone 1',
              description: 'Zone for event 1',
              relevance: 100,
              metadata: { eventId: 1 },
            },
          ],
        },
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const params = {
        query: 'zone',
        filters: { eventId: 1 },
      };

      const result = await searchService.advancedSearch(params, mockAccessToken);

      expect(result.results[0].metadata?.eventId).toBe(1);
    });

    it('devrait gérer les résultats vides avec des filtres', async () => {
      const mockResponse = {
        data: {
          query: 'nonexistent',
          totalResults: 0,
          results: [],
        },
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const params = {
        query: 'nonexistent',
        filters: { type: 'event' },
      };

      const result = await searchService.advancedSearch(params, mockAccessToken);

      expect(result.results).toHaveLength(0);
    });
  });

  describe('Integration with token', () => {
    it('devrait passer le token correctement à globalSearch', async () => {
      const mockResponse = {
        data: {
          query: 'test',
          totalResults: 0,
          results: [],
          summary: { events: 0, users: 0, zones: 0, messages: 0 },
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      await searchService.globalSearch('test', 5, 0, mockAccessToken);

      expect(api.get).toHaveBeenCalledWith(
        expect.any(String),
        mockAccessToken
      );
    });

    it('devrait passer le token correctement à searchByType', async () => {
      const mockResponse = {
        data: {
          type: 'event',
          query: 'test',
          totalResults: 0,
          results: [],
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      await searchService.searchByType('event', 'test', 10, mockAccessToken);

      expect(api.get).toHaveBeenCalledWith(
        expect.any(String),
        mockAccessToken
      );
    });

    it('devrait passer le token correctement à advancedSearch', async () => {
      const mockResponse = {
        data: {
          query: 'test',
          totalResults: 0,
          results: [],
        },
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const params = { query: 'test' };
      await searchService.advancedSearch(params, mockAccessToken);

      expect(api.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        mockAccessToken
      );
    });
  });
});
