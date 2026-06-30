import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database";
import type { PoolConnection } from "mysql2/promise";

export const NOTIFICATION_TYPES = [
  "PARTICIPATION_REQUEST",
  "PARTICIPATION_APPROVED",
  "PARTICIPATION_REFUSED",
  "EVENT_UPDATE",
  "CHAT_MENTION",
  "SYSTEM",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification extends RowDataPacket {
  id: number;
  user_id: number;
  title: string;
  body: string | null;
  type: NotificationType;
  reference_type: string | null;
  reference_id: number | null;
  is_read: boolean;
  created_at: Date;
}

export interface CreateNotificationInput {
  userId: number;
  title: string;
  body?: string | null;
  type: NotificationType;
  referenceType?: string | null;
  referenceId?: number | null;
}

export interface NotificationPage {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export async function createNotification(
  input: CreateNotificationInput,
  connection?: PoolConnection,
): Promise<Notification> {
  const database = connection ?? pool;
  const [result] = await database.query<ResultSetHeader>(
    `INSERT INTO notifications
      (user_id, title, body, type, reference_type, reference_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.title,
      input.body ?? null,
      input.type,
      input.referenceType ?? null,
      input.referenceId ?? null,
    ],
  );

  const notification = await getNotificationById(
    result.insertId,
    input.userId,
    connection,
  );
  if (!notification) {
    throw new Error("La notification créée est introuvable.");
  }

  return notification;
}

export async function getNotificationById(
  notificationId: number,
  userId: number,
  connection?: PoolConnection,
): Promise<Notification | null> {
  const database = connection ?? pool;
  const [rows] = await database.query<Notification[]>(
    `SELECT id, user_id, title, body, type, reference_type, reference_id,
            is_read, created_at
     FROM notifications
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId],
  );

  return rows[0] ?? null;
}


export async function listNotifications(
  userId: number,
  page: number,
  limit: number,
  unreadOnly: boolean,
): Promise<NotificationPage> {
  const offset = (page - 1) * limit;
  const unreadFilter = unreadOnly ? " AND is_read = FALSE" : "";

  const [[countRow], [notifications], [unreadRow]] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM notifications
       WHERE user_id = ?${unreadFilter}`,
      [userId],
    ),
    pool.query<Notification[]>(
      `SELECT id, user_id, title, body, type, reference_type, reference_id,
              is_read, created_at
       FROM notifications
       WHERE user_id = ?${unreadFilter}
       ORDER BY created_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM notifications
       WHERE user_id = ? AND is_read = FALSE`,
      [userId],
    ),
  ]);

  const total = Number(countRow[0]?.total ?? 0);
  const unreadCount = Number(unreadRow[0]?.total ?? 0);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount,
  };
}

export async function getUnreadCount(userId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM notifications
     WHERE user_id = ? AND is_read = FALSE`,
    [userId],
  );

  return Number(rows[0]?.total ?? 0);
}

export async function markNotificationAsRead(
  notificationId: number,
  userId: number,
): Promise<Notification | null> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE notifications SET is_read = TRUE
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId],
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getNotificationById(notificationId, userId);
}

export async function markAllNotificationsAsRead(userId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE notifications SET is_read = TRUE
     WHERE user_id = ? AND is_read = FALSE`,
    [userId],
  );

  return result.affectedRows;
}

export async function deleteNotification(
  notificationId: number,
  userId: number,
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM notifications WHERE id = ? AND user_id = ?",
    [notificationId, userId],
  );

  return result.affectedRows > 0;
}
