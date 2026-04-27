import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import {
  generateBadgeToken,
  listEventApprovedParticipants,
  verifyAccess,
} from "../controllers/access.controller";

const router = Router();

router.post(
  "/verify",
  authenticate,
  authorize("ADMIN", "SCANNER"),
  verifyAccess,
);
router.get(
  "/events/:eventId/participants",
  authenticate,
  authorize("ADMIN", "SCANNER"),
  listEventApprovedParticipants,
);
router.post(
  "/badge-token",
  authenticate,
  authorize("ADMIN", "SCANNER"),
  generateBadgeToken,
);

export default router;
