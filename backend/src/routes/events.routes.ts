import express from 'express';
import { createEvent, deleteEvent, getAllEvents, getEventById, updateEvent } from '../controllers/events.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { requireFreshPassword } from '../middlewares/requireFreshPassword';

const router = express.Router();

router.use(authenticate);
router.use(requireFreshPassword);

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', authorize('ADMIN'), createEvent); 
router.put('/:id', authorize('ADMIN'), updateEvent);
router.delete('/:id', authorize('ADMIN'), deleteEvent); 



export default router;
