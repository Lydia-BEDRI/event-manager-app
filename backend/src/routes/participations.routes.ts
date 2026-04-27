import express from 'express';
import { 
  getAllParticipations,
  getParticipationsByEvent,
  getMyParticipantStats,
  getMyParticipations,
  registerForEvent,
  approveParticipation
} from '../controllers/participations.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.post('/', authenticate, registerForEvent);
router.patch('/:id/approve', authenticate, authorize('ADMIN'), approveParticipation);
router.get('/', authenticate, authorize('ADMIN'), getAllParticipations);
router.get('/event/:eventId', authenticate, authorize('ADMIN'), getParticipationsByEvent);
router.get('/my-stats', authenticate, getMyParticipantStats);
router.get('/my-participations', authenticate, getMyParticipations);

export default router;
