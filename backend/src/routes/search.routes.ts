import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireFreshPassword } from '../middlewares/requireFreshPassword';
import { searchLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * Base path: /api/search
 */

/**
 * GET /api/search?q=query&limit=5&offset=0
 */
router.get('/', authenticate, requireFreshPassword, searchLimiter, SearchController.globalSearch);

/**
 * POST /api/search/advanced
 */
router.post('/advanced', authenticate, requireFreshPassword, searchLimiter, SearchController.advancedSearch);

/**
 * GET /api/search/by-type/:type?q=query&limit=10
 */
router.get('/by-type/:type', authenticate, requireFreshPassword, searchLimiter, SearchController.searchByType);

/**
 * GET /api/search/health
 */
router.get('/health', SearchController.health);

export default router;
