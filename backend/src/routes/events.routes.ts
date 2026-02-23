import express from 'express';
import { getAllEvents, getEventById } from '../controllers/events.controller';
import { authenticate } from '../middlewares/authenticate';

const router = express.Router();

router.get('/', authenticate, getAllEvents);
router.get('/:id', authenticate, getEventById);

export default router;