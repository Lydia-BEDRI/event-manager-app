import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

/**
 * Base path: /api/search
 */

/**
 * GET /api/search?q=query&limit=5&offset=0
 */
router.get('/', authenticate, SearchController.globalSearch);

/**
 * POST /api/search/advanced
 */
router.post('/advanced', authenticate, SearchController.advancedSearch);

/**
 * GET /api/search/by-type/:type?q=query&limit=10
 */
router.get('/by-type/:type', authenticate, SearchController.searchByType);

/**
 * GET /api/search/health
 */
router.get('/health', SearchController.health);

export default router;
