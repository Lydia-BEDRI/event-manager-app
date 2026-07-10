import express from 'express';
import {
  generateBadgeToken,
  listEventApprovedParticipants,
  verifyAccess,
} from '../controllers/access.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { requireFreshPassword } from '../middlewares/requireFreshPassword';

const router = express.Router();

router.post('/verify', authenticate, requireFreshPassword, authorize('ADMIN'), verifyAccess);
router.get('/events/:eventId/participants', authenticate, requireFreshPassword, authorize('ADMIN'), listEventApprovedParticipants);
router.post('/badge-token', authenticate, requireFreshPassword, authorize('ADMIN'), generateBadgeToken);

export default router;
