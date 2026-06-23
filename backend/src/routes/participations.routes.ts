import express from 'express';
import { 
  getAllParticipations,
  getParticipationsByEvent,
  getMyParticipantStats,
  requestParticipation,
  getMyQrCodes,
  generateParticipationQrCode,
  verifyPresence
} from '../controllers/participations.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN'), getAllParticipations);
router.get('/event/:eventId', authenticate, authorize('ADMIN'), getParticipationsByEvent);
router.get('/my-stats', authenticate, getMyParticipantStats);
router.get('/my-qr-codes', authenticate, getMyQrCodes);
router.post('/events/:eventId/request', authenticate, authorize('PARTICIPANT'), requestParticipation);
router.post('/:participationId/qr-code', authenticate, generateParticipationQrCode);
router.post('/verify-presence', authenticate, verifyPresence);

export default router;
