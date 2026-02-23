import express from 'express';
import { getAllEvents, getEventById } from '../controllers/events.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.get('/events', authenticate, authorize('ADMIN'),getAllEvents);
router.get('/:id', authenticate, getEventById);

export default router;