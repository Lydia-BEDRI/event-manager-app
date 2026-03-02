import express from 'express';
import { 
  getAllParticipations,
  getParticipationsByEvent
} from '../controllers/participations.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN'), getAllParticipations);
router.get('/event/:eventId', authenticate, authorize('ADMIN'), getParticipationsByEvent);

export default router;
