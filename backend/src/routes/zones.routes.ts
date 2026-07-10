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
import { requireFreshPassword } from '../middlewares/requireFreshPassword';

const router = express.Router();

router.use(authenticate);
router.use(requireFreshPassword);

router.get('/distinct', getDistinctZones);
router.get('/event/:eventId', getEventZones);
// Routes admin
router.get('/', authorize('ADMIN'), getAllZones);
router.post('/:eventId/zones', authorize('ADMIN'), createZone);
router.put('/:eventId/zones/:zoneId', authorize('ADMIN'), updateZone);
router.delete('/:eventId/zones/:zoneId', authorize('ADMIN'), deleteZone);
export default router;
