import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import {
  exportEvents,
  exportParticipations,
  exportAccessLogs,
  exportUsers,
  exportZones,
  exportStatistics,
  exportComplete
} from '../controllers/export.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/events', exportEvents);
router.get('/participations', exportParticipations);
router.get('/access-logs', exportAccessLogs);
router.get('/users', exportUsers);
router.get('/zones', exportZones);
router.get('/statistics', exportStatistics);

router.get('/complete', exportComplete);

export default router;
