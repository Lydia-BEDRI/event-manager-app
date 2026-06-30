import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate";
import {
  createNotification,
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification.service";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";
import { emitNotification } from "../sockets/server.socket";

function positiveInteger(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function notificationId(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user!.userId;
  const page = positiveInteger(req.query.page, 1);
  const limit = Math.min(positiveInteger(req.query.limit, 20), 100);
  const unreadOnly = req.query.unreadOnly === "true";

  try {
    res.json(await listNotifications(userId, page, limit, unreadOnly));
  } catch (error) {
    console.error("Erreur getNotifications:", error);
    res.status(500).json({ error: "Impossible de charger les notifications." });
  }
}

export async function getNotificationsUnreadCount(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    res.json({ unreadCount: await getUnreadCount(req.user!.userId) });
  } catch (error) {
    console.error("Erreur getNotificationsUnreadCount:", error);
    res.status(500).json({ error: "Impossible de charger le compteur." });
  }
}

export async function readNotification(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = notificationId(req.params.notificationId);
  if (!id) {
    res.status(400).json({ error: "Identifiant de notification invalide." });
    return;
  }

  try {
    const notification = await markNotificationAsRead(id, req.user!.userId);
    if (!notification) {
      res.status(404).json({ error: "Notification introuvable." });
      return;
    }
    res.json({ notification });
  } catch (error) {
    console.error("Erreur readNotification:", error);
    res.status(500).json({ error: "Impossible de lire la notification." });
  }
}

export async function readAllNotifications(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const updatedCount = await markAllNotificationsAsRead(req.user!.userId);
    res.json({ updatedCount });
  } catch (error) {
    console.error("Erreur readAllNotifications:", error);
    res.status(500).json({ error: "Impossible de lire les notifications." });
  }
}

export async function removeNotification(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const id = notificationId(req.params.notificationId);
  if (!id) {
    res.status(400).json({ error: "Identifiant de notification invalide." });
    return;
  }

  try {
    if (!(await deleteNotification(id, req.user!.userId))) {
      res.status(404).json({ error: "Notification introuvable." });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur removeNotification:", error);
    res.status(500).json({ error: "Impossible de supprimer la notification." });
  }
}

export async function createSystemNotification(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const title = String(req.body.title ?? "").trim();
  const body = String(req.body.body ?? "").trim();
  const target = String(req.body.target ?? "").toUpperCase();
  const userIds = Array.isArray(req.body.userIds)
    ? [...new Set<number>(req.body.userIds.map(Number).filter(
        (id: number) => Number.isInteger(id) && id > 0,
      ))]
    : [];

  if (!title || title.length > 255 || body.length > 2000) {
    res.status(400).json({ error: "Titre ou contenu invalide." });
    return;
  }

  try {
    let query = "SELECT id FROM users WHERE is_active = TRUE";
    const values: Array<string | number> = [];

    if (target === "ADMIN" || target === "PARTICIPANT") {
      query += " AND role = ?";
      values.push(target);
    } else if (target === "USERS" && userIds.length > 0) {
      query += ` AND id IN (${userIds.map(() => "?").join(", ")})`;
      values.push(...userIds);
    } else if (target !== "ALL") {
      res.status(400).json({
        error: "Cible invalide : utilisez ALL, ADMIN, PARTICIPANT ou USERS.",
      });
      return;
    }

    const [recipients] = await pool.query<RowDataPacket[]>(query, values);
    if (recipients.length === 0) {
      res.status(400).json({ error: "Aucun destinataire actif trouvé." });
      return;
    }

    const notifications = await Promise.all(
      recipients.map((recipient) => createNotification({
        userId: recipient.id,
        title,
        body: body || null,
        type: "SYSTEM",
      })),
    );
    notifications.forEach((notification) => emitNotification(notification));

    res.status(201).json({ createdCount: notifications.length });
  } catch (error) {
    console.error("Erreur createSystemNotification:", error);
    res.status(500).json({ error: "Impossible de créer la notification système." });
  }
}
