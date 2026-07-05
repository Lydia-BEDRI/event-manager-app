import express from 'express';
import {
  generateBadgeToken,
  listEventApprovedParticipants,
  verifyAccess,
} from '../controllers/access.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.post('/verify', authenticate, authorize('ADMIN'), verifyAccess);
router.get('/events/:eventId/participants', authenticate, authorize('ADMIN'), listEventApprovedParticipants);
router.post('/badge-token', authenticate, authorize('ADMIN'), generateBadgeToken);

export default router;
