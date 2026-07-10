import express from 'express';
import { 
  getAllParticipations,
  getParticipationsByEvent,
  updateParticipationStatus,
  getMyParticipantStats,
  requestParticipation,
  getMyQrCodes,
  generateParticipationQrCode,
} from '../controllers/participations.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { requireFreshPassword } from '../middlewares/requireFreshPassword';

const router = express.Router();

router.use(authenticate);
router.use(requireFreshPassword);

router.get('/', authorize('ADMIN'), getAllParticipations);
router.get('/event/:eventId', authorize('ADMIN'), getParticipationsByEvent);
router.patch('/:participationId/status', authorize('ADMIN'), updateParticipationStatus);
router.get('/my-stats', getMyParticipantStats);
router.get('/my-qr-codes', getMyQrCodes);
router.post('/events/:eventId/request', authorize('PARTICIPANT'), requestParticipation);
router.post('/:participationId/qr-code', generateParticipationQrCode);

export default router;
