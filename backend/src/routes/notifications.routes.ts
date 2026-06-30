import { Router } from "express";
import {
  getNotifications,
  getNotificationsUnreadCount,
  createSystemNotification,
  readAllNotifications,
  readNotification,
  removeNotification,
} from "../controllers/notifications.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.use(authenticate);
router.get("/", getNotifications);
router.get("/unread-count", getNotificationsUnreadCount);
router.post("/system", authorize("ADMIN"), createSystemNotification);
router.patch("/read-all", readAllNotifications);
router.patch("/:notificationId/read", readNotification);
router.delete("/:notificationId", removeNotification);

export default router;
