import { Router } from 'express';
import { getDashboardStats } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { requireFreshPassword } from '../middlewares/requireFreshPassword';

const router = Router();

router.get('/dashboard-stats', authenticate, requireFreshPassword, authorize('ADMIN'), getDashboardStats);

export default router;
