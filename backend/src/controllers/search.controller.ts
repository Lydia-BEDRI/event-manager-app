import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { AuthenticatedRequest } from '../middlewares/authenticate';

export class SearchController {
  /**
   * Effectue une recherche globale sur tous les types d'entités
   * GET /api/search
   * Query params:
   *   - q: string (obligatoire) => Terme de recherche
   *   - limit: number (optionnel, défaut: 5) => Résultats par type
   *   - offset: number (optionnel, défaut: 0) => Décalage pour pagination
   * Types searchés: events, users, zones, messages
   */
  static async globalSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Non authentifié.',
        });
        return;
      }

      const { q, limit = 5, offset = 0 } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Query parameter "q" is required and must not be empty',
        });
        return;
      }

      const parsedLimit = Math.min(Math.max(parseInt(limit as string) || 5, 1), 50);
      const parsedOffset = Math.max(parseInt(offset as string) || 0, 0);

      const results = await SearchService.globalSearch(
        q,
        req.user.userId,
        req.user.role as 'ADMIN' | 'PARTICIPANT',
        parsedLimit,
        parsedOffset
      );

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('Global search error:', error);
      res.status(500).json({
        success: false,
        error: 'An error occurred during search',
      });
    }
  }

  /**
   * Effectue une recherche avancée avec filtres
   * POST /api/search/advanced
   * Body:
   *   {
   *     query: string,
   *     filters?: {
   *       type?: 'event' | 'user' | 'zone' | 'message',
   *       eventId?: number,
   *       status?: string,
   *       dateFrom?: string,
   *       dateTo?: string
   *     },
   *     limit?: number,
   *     offset?: number
   *   }
   */
  static async advancedSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Non authentifié.',
        });
        return;
      }

      const { query, filters, limit = 10, offset = 0 } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Query field is required and must not be empty',
        });
        return;
      }

      const parsedLimit = Math.min(Math.max(limit, 1), 100);
      const parsedOffset = Math.max(offset, 0);

      const results = await SearchService.advancedSearch(
        query,
        req.user.userId,
        req.user.role as 'ADMIN' | 'PARTICIPANT',
        filters,
        parsedLimit,
        parsedOffset
      );

      res.status(200).json({
        success: true,
        data: {
          query,
          totalResults: results.length,
          results,
          filters,
        },
      });
    } catch (error) {
      console.error('Advanced search error:', error);
      res.status(500).json({
        success: false,
        error: 'An error occurred during search',
      });
    }
  }

  /**
   * Effectue une recherche par type spécifique (pour autocomplete)
   * GET /api/search/by-type/:type
   * Query params:
   *   - q: string (obligatoire) - Terme de recherche
   *   - limit: number (optionnel, défaut: 10)
   */
  static async searchByType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Non authentifié.',
        });
        return;
      }

      const { type } = req.params;
      const { q, limit = 10 } = req.query;

      const validTypes = ['event', 'user', 'zone', 'message'];
      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
        });
        return;
      }

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Query parameter "q" is required and must not be empty',
        });
        return;
      }

      const parsedLimit = Math.min(Math.max(parseInt(limit as string) || 10, 1), 50);

      const results = await SearchService.searchByType(
        q,
        type as 'event' | 'user' | 'zone' | 'message' | 'participation',
        req.user.userId,
        req.user.role as 'ADMIN' | 'PARTICIPANT',
        parsedLimit
      );

      res.status(200).json({
        success: true,
        data: {
          type,
          query: q,
          totalResults: results.length,
          results,
        },
      });
    } catch (error) {
      console.error('Search by type error:', error);
      res.status(500).json({
        success: false,
        error: 'An error occurred during search',
      });
    }
  }

  /**
   * Endpoint de santé pour la recherche
   * GET /api/search/health
   */
  static async health(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Search API is healthy',
      timestamp: new Date().toISOString(),
    });
  }
}
