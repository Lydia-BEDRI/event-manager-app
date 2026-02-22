import { Router } from 'express';
import { getDashboardStats } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get('/dashboard-stats', authenticate, authorize('ADMIN'), getDashboardStats);

export default router;
