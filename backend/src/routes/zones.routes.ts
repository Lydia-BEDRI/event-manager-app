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

router.get('/distinct', authenticate, getDistinctZones);
router.get('/event/:eventId', authenticate, getEventZones);
// Routes admin
router.get('/', authenticate, authorize('ADMIN'), getAllZones);
router.post('/:eventId/zones', authenticate, authorize('ADMIN'), createZone);
router.put('/:eventId/zones/:zoneId', authenticate, authorize('ADMIN'), updateZone);
router.delete('/:eventId/zones/:zoneId', authenticate, authorize('ADMIN'), deleteZone);
export default router;