import express from 'express';
import { 
  createZone,
  getEventZones,
  updateZone,
  deleteZone,
  getAllZones,
  getDistinctZones
} from '../controllers/zones.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN'), getAllZones);
router.get('/distinct', authenticate, authorize('ADMIN'), getDistinctZones); // ← Nouvelle route
router.post('/:eventId/zones', authenticate, authorize('ADMIN'), createZone);
router.get('/:eventId/zones', authenticate, getEventZones);
router.put('/:eventId/zones/:zoneId', authenticate, authorize('ADMIN'), updateZone);
router.delete('/:eventId/zones/:zoneId', authenticate, authorize('ADMIN'), deleteZone);

export default router;