import { SearchService } from '../services/search.service';
import pool from '../config/database';

describe('SearchService - Global Search Integration Tests', () => {
  let dbAvailable = false;

  beforeAll(async () => {
    // Setup: Vérifier que la base de données est disponible
    try {
      const connection = await pool.getConnection();
      try {
        const [indices] = await connection.query(
          'SHOW INDEX FROM events WHERE Key_name LIKE "idx_fulltext%"'
        ) as any[];
        if (Array.isArray(indices) && indices.length === 0) {
          console.warn('⚠️ Warning: FULLTEXT indices not found. Run migration first.');
        }
        dbAvailable = true;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.warn('⚠️ Database is not available. Integration tests will be skipped.');
      dbAvailable = false;
    }
  });

  const testIfDbAvailable = (description: string, fn: () => Promise<void>) => {
    if (dbAvailable) {
      it(description, fn);
    } else {
      it.skip(description, fn);
    }
  };

  describe('globalSearch()', () => {
    testIfDbAvailable('should return results with all entity types', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const results = await SearchService.globalSearch('test', 5, 0);
      
      expect(results).toBeDefined();
      expect(results.query).toBe('test');
      expect(results.totalResults).toBeGreaterThanOrEqual(0);
      expect(results.results).toBeInstanceOf(Array);
      expect(results.summary).toBeDefined();
      expect(results.summary.events).toBeGreaterThanOrEqual(0);
      expect(results.summary.users).toBeGreaterThanOrEqual(0);
      expect(results.summary.zones).toBeGreaterThanOrEqual(0);
      expect(results.summary.messages).toBeGreaterThanOrEqual(0);
    });

    testIfDbAvailable('should throw error on empty query', async () => {
      await expect(SearchService.globalSearch('', 5, 0)).rejects.toThrow();
      await expect(SearchService.globalSearch('   ', 5, 0)).rejects.toThrow();
    });

    testIfDbAvailable('should respect limit parameter', async () => {
      const results = await SearchService.globalSearch('a', 3, 0);
      
      expect(results.results.length).toBeLessThanOrEqual(3 * 4);
    });

    testIfDbAvailable('should return results with correct structure', async () => {
      const results = await SearchService.globalSearch('event', 5, 0);
      
      if (results.results.length > 0) {
        const firstResult = results.results[0];
        
        expect(firstResult.type).toMatch(/^(event|user|zone|message)$/);
        expect(firstResult.id).toBeGreaterThan(0);
        expect(firstResult.title).toBeDefined();
        expect(firstResult.relevance).toBeGreaterThan(0);
      }
    });
  });

  describe('searchByType()', () => {
    testIfDbAvailable('should search events correctly', async () => {
      const results = await SearchService.searchByType('event test', 'event', 10);
      
      expect(results).toBeInstanceOf(Array);
      results.forEach((result) => {
        expect(result.type).toBe('event');
      });
    });

    testIfDbAvailable('should search users correctly', async () => {
      const results = await SearchService.searchByType('admin', 'user', 10);
      
      expect(results).toBeInstanceOf(Array);
      results.forEach((result) => {
        expect(result.type).toBe('user');
      });
    });

    testIfDbAvailable('should search zones correctly', async () => {
      const results = await SearchService.searchByType('zone', 'zone', 10);
      
      expect(results).toBeInstanceOf(Array);
      results.forEach((result) => {
        expect(result.type).toBe('zone');
      });
    });

    testIfDbAvailable('should search messages correctly', async () => {
      const results = await SearchService.searchByType('hello', 'message', 10);
      
      expect(results).toBeInstanceOf(Array);
      results.forEach((result) => {
        expect(result.type).toBe('message');
      });
    });

    testIfDbAvailable('should throw on invalid type', async () => {
      await expect(
        SearchService.searchByType('test', 'invalid' as any, 10)
      ).rejects.toThrow();
    });
  });

  describe('advancedSearch()', () => {
    testIfDbAvailable('should filter by type', async () => {
      const results = await SearchService.advancedSearch('test', { type: 'event' }, 10);
      
      results.forEach((result) => {
        expect(result.type).toBe('event');
      });
    });

    testIfDbAvailable('should filter by eventId when searching zones', async () => {
      const zoneResults = await SearchService.searchByType('zone', 'zone', 1);
      
      if (zoneResults.length > 0) {
        const eventId = zoneResults[0].metadata?.eventId;
        const results = await SearchService.advancedSearch('zone', { eventId }, 10);
        
        results.forEach((result) => {
          if (result.type === 'zone') {
            expect(result.metadata?.eventId).toBe(eventId);
          }
        });
      }
    });

    testIfDbAvailable('should handle empty results gracefully', async () => {
      const results = await SearchService.advancedSearch('xyzabc123notexist', {}, 10);
      
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    testIfDbAvailable('should complete search within reasonable time', async () => {
      const startTime = Date.now();
      const results = await SearchService.globalSearch('event', 10, 0);
      const duration = Date.now() - startTime;
      
      expect(results).toBeDefined();
      expect(duration).toBeLessThan(500);
    });

    testIfDbAvailable('should handle pagination correctly', async () => {
      const page1 = await SearchService.globalSearch('e', 5, 0);
      const page2 = await SearchService.globalSearch('e', 5, 5);
      
      if (page1.totalResults > 5) {
        expect(page1.results).not.toEqual(page2.results);
      }
    });
  });

  describe('Safety Tests', () => {
    testIfDbAvailable('should handle SQL injection attempts', async () => {
      const maliciousQueries = [
        "'; DROP TABLE events; --",
        "1' UNION SELECT * FROM users--",
        "test+OR+1=1",
      ];

      for (const query of maliciousQueries) {
        const results = await SearchService.globalSearch(query, 5, 0);
        expect(results).toBeDefined();
      }
    });

    testIfDbAvailable('should normalize special characters', async () => {
      const specialQueries = [
        'café',
        'naïve',
        'résumé',
        'über',
      ];

      for (const query of specialQueries) {
        const results = await SearchService.globalSearch(query, 5, 0);
        expect(results).toBeDefined();
      }
    });
  });
});
