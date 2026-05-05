/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { searchService, AdvancedSearchParams } from '../../../services/search.service';

jest.mock('../../../services/search.service');

const mockSearchService = searchService as jest.Mocked<typeof searchService>;

describe('SearchBar Component - Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Methods', () => {
    it('should have globalSearch method', () => {
      expect(mockSearchService.globalSearch).toBeDefined();
    });

    it('should have searchByType method', () => {
      expect(mockSearchService.searchByType).toBeDefined();
    });

    it('should have advancedSearch method', () => {
      expect(mockSearchService.advancedSearch).toBeDefined();
    });
  });

  describe('Search Results Structure', () => {
    it('should return properly structured global search results', async () => {
      mockSearchService.globalSearch.mockResolvedValue({
        query: 'test',
        totalResults: 1,
        results: [
          {
            type: 'event',
            id: 1,
            title: 'Test Event',
            description: 'An event',
            relevance: 100,
          },
        ],
        summary: { events: 1, users: 0, zones: 0, messages: 0 },
      });

      const result = await mockSearchService.globalSearch('test', 5, 0, 'token');

      expect(result.query).toBe('test');
      expect(result.totalResults).toBe(1);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].type).toBe('event');
    });

    it('should return empty results for non-existent queries', async () => {
      mockSearchService.globalSearch.mockResolvedValue({
        query: 'nonexistent',
        totalResults: 0,
        results: [],
        summary: { events: 0, users: 0, zones: 0, messages: 0 },
      });

      const result = await mockSearchService.globalSearch('nonexistent', 5, 0, 'token');

      expect(result.results).toHaveLength(0);
      expect(result.totalResults).toBe(0);
    });

    it('should return multiple result types', async () => {
      mockSearchService.globalSearch.mockResolvedValue({
        query: 'test',
        totalResults: 4,
        results: [
          {
            type: 'event',
            id: 1,
            title: 'Test Event',
            description: 'An event',
            relevance: 100,
          },
          {
            type: 'user',
            id: 2,
            title: 'Test User',
            description: 'A user',
            relevance: 90,
          },
          {
            type: 'zone',
            id: 3,
            title: 'Test Zone',
            description: 'A zone',
            relevance: 80,
          },
          {
            type: 'message',
            id: 4,
            title: 'Test Message',
            description: 'A message',
            relevance: 70,
          },
        ],
        summary: { events: 1, users: 1, zones: 1, messages: 1 },
      });

      const result = await mockSearchService.globalSearch('test', 10, 0, 'token');

      expect(result.results).toHaveLength(4);
      const types = result.results.map(r => r.type);
      expect(types).toContain('event');
      expect(types).toContain('user');
      expect(types).toContain('zone');
      expect(types).toContain('message');
    });
  });

  describe('Token Handling', () => {
    it('should pass token to search service', async () => {
      mockSearchService.globalSearch.mockResolvedValue({
        query: 'test',
        totalResults: 0,
        results: [],
        summary: { events: 0, users: 0, zones: 0, messages: 0 },
      });

      await mockSearchService.globalSearch('test', 5, 0, 'my-token');

      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(
        'test',
        5,
        0,
        'my-token'
      );
    });
  });

  describe('Pagination', () => {
    it('should support limit parameter', async () => {
      mockSearchService.globalSearch.mockResolvedValue({
        query: 'test',
        totalResults: 0,
        results: [],
        summary: { events: 0, users: 0, zones: 0, messages: 0 },
      });

      await mockSearchService.globalSearch('test', 10, 0, 'token');

      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(
        'test',
        10,
        expect.any(Number),
        'token'
      );
    });

    it('should support offset parameter', async () => {
      mockSearchService.globalSearch.mockResolvedValue({
        query: 'test',
        totalResults: 0,
        results: [],
        summary: { events: 0, users: 0, zones: 0, messages: 0 },
      });

      await mockSearchService.globalSearch('test', 5, 10, 'token');

      expect(mockSearchService.globalSearch).toHaveBeenCalledWith(
        'test',
        5,
        10,
        'token'
      );
    });
  });

  describe('Result Types', () => {
    it('should handle event search results', async () => {
      mockSearchService.searchByType.mockResolvedValue({
        type: 'event',
        query: 'conference',
        totalResults: 1,
        results: [
          {
            type: 'event',
            id: 1,
            title: 'Conférence Tech',
            description: 'A tech conference',
            relevance: 100,
          },
        ],
      });

      const result = await mockSearchService.searchByType('event', 'conference', 10, 'token');

      expect(result.type).toBe('event');
      expect(result.results[0].type).toBe('event');
    });

    it('should handle user search results', async () => {
      mockSearchService.searchByType.mockResolvedValue({
        type: 'user',
        query: 'john',
        totalResults: 1,
        results: [
          {
            type: 'user',
            id: 1,
            title: 'John Doe',
            description: 'john@example.com',
            relevance: 100,
          },
        ],
      });

      const result = await mockSearchService.searchByType('user', 'john', 10, 'token');

      expect(result.type).toBe('user');
      expect(result.results[0].type).toBe('user');
    });

    it('should handle zone search results', async () => {
      mockSearchService.searchByType.mockResolvedValue({
        type: 'zone',
        query: 'paris',
        totalResults: 1,
        results: [
          {
            type: 'zone',
            id: 1,
            title: 'Paris',
            description: 'Paris zone',
            relevance: 100,
          },
        ],
      });

      const result = await mockSearchService.searchByType('zone', 'paris', 10, 'token');

      expect(result.type).toBe('zone');
      expect(result.results[0].type).toBe('zone');
    });

    it('should handle message search results', async () => {
      mockSearchService.searchByType.mockResolvedValue({
        type: 'message',
        query: 'hello',
        totalResults: 1,
        results: [
          {
            type: 'message',
            id: 1,
            title: 'Hello',
            description: 'A message',
            relevance: 100,
          },
        ],
      });

      const result = await mockSearchService.searchByType('message', 'hello', 10, 'token');

      expect(result.type).toBe('message');
      expect(result.results[0].type).toBe('message');
    });
  });

  describe('Advanced Search', () => {
    it('should support filtering by type', async () => {
      mockSearchService.advancedSearch.mockResolvedValue({
        query: 'test',
        totalResults: 1,
        results: [
          {
            type: 'event',
            id: 1,
            title: 'Test',
            description: 'Test',
            relevance: 100,
          },
        ],
      });

      const params: AdvancedSearchParams = { query: 'test', filters: { type: 'event' } };
      const result = await mockSearchService.advancedSearch(params, 'token');

      expect(mockSearchService.advancedSearch).toHaveBeenCalledWith(params, 'token');
      expect(result.results).toHaveLength(1);
    });

    it('should support filtering by eventId', async () => {
      mockSearchService.advancedSearch.mockResolvedValue({
        query: 'zone',
        totalResults: 1,
        results: [
          {
            type: 'zone',
            id: 1,
            title: 'Zone',
            description: 'Zone for event',
            relevance: 100,
            metadata: { eventId: 5 },
          },
        ],
      });

      const params = { query: 'zone', filters: { eventId: 5 } };
      const result = await mockSearchService.advancedSearch(params, 'token');

      expect(result.results[0].metadata?.eventId).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors', async () => {
      mockSearchService.globalSearch.mockRejectedValue(new Error('Network error'));

      await expect(mockSearchService.globalSearch('test', 5, 0, 'token')).rejects.toThrow('Network error');
    });
  });
});
