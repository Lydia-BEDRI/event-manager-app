import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requireFreshPassword } from "../middlewares/requireFreshPassword";
import {
  deleteOwnMessage,
  getChatEvents,
  getMembers,
  getMessages,
  moderateChatMessage,
  postMessage,
} from "../controllers/chat.controller";

const router = Router();

router.use(authenticate);
router.use(requireFreshPassword);

router.get("/events", getChatEvents);
router.get("/events/:eventId/messages", getMessages);
router.get("/events/:eventId/members", getMembers);
router.post("/events/:eventId/messages", postMessage);
router.delete("/messages/:messageId", deleteOwnMessage);
router.patch(
  "/messages/:messageId/moderate",
  moderateChatMessage,
);

export default router;
