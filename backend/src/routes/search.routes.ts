import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middlewares/authenticate';
import { searchLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * Base path: /api/search
 */

/**
 * GET /api/search?q=query&limit=5&offset=0
 */
router.get('/', authenticate, searchLimiter, SearchController.globalSearch);

/**
 * POST /api/search/advanced
 */
router.post('/advanced', authenticate, searchLimiter, SearchController.advancedSearch);

/**
 * GET /api/search/by-type/:type?q=query&limit=10
 */
router.get('/by-type/:type', authenticate, searchLimiter, SearchController.searchByType);

/**
 * GET /api/search/health
 */
router.get('/health', SearchController.health);

export default router;
