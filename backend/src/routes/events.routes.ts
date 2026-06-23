import express from 'express';
import { createEvent, deleteEvent, getAllEvents, getEventById, updateEvent } from '../controllers/events.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = express.Router();

router.get('/', authenticate, getAllEvents);
router.get('/:id', authenticate, getEventById);
router.post('/', authenticate, authorize('ADMIN'), createEvent); 
router.put('/:id', authenticate, authorize('ADMIN'), updateEvent);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteEvent); 



export default router;