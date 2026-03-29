import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  deleteOwnMessage,
  getChatEvents,
  getMembers,
  getMessages,
  moderateChatMessage,
  postMessage,
} from "../controllers/chat.controller";

const router = Router();

router.get("/events", authenticate, getChatEvents);
router.get("/events/:eventId/messages", authenticate, getMessages);
router.get("/events/:eventId/members", authenticate, getMembers);
router.post("/events/:eventId/messages", authenticate, postMessage);
router.delete("/messages/:messageId", authenticate, deleteOwnMessage);
router.patch(
  "/messages/:messageId/moderate",
  authenticate,
  moderateChatMessage,
);

export default router;
