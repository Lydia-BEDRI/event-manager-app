import express from 'express';
import { 
  getAllParticipations,
  getParticipationsByEvent,
  getMyParticipantStats
} from '../controllers/participations.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN'), getAllParticipations);
router.get('/event/:eventId', authenticate, authorize('ADMIN'), getParticipationsByEvent);
router.get('/my-stats', authenticate, getMyParticipantStats);

export default router;
