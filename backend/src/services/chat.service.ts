import pool from "../config/database";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TokenPayload } from "../utils/jwt";

interface EventRow extends RowDataPacket {
  id: number;
  created_by: number;
}

interface ParticipationRow extends RowDataPacket {
  id: number;
}

interface ChatEventRow extends RowDataPacket {
  id: number;
  name: string;
  location: string;
  start_date: Date;
  end_date: Date;
  status: string;
}

interface MessageRow extends RowDataPacket {
  id: number;
  event_id: number;
  user_id: number;
  content: string;
  is_deleted: number;
  is_moderated: number;
  moderated_by: number | null;
  moderated_at: Date | null;
  created_at: Date;
  first_name: string;
  last_name: string;
  role: string;
  moderator_first_name: string | null;
  moderator_last_name: string | null;
}

interface MinimalMessageRow extends RowDataPacket {
  id: number;
  event_id: number;
  user_id: number;
  is_deleted: number;
}

export interface ChatMessage {
  id: number;
  eventId: number;
  userId: number;
  authorName: string;
  authorRole: string;
  content: string;
  isDeleted: boolean;
  isModerated: boolean;
  moderatedBy: number | null;
  moderatedByName: string | null;
  moderatedAt: string | null;
  createdAt: string;
}

export interface ChatEventSummary {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface ChatMember {
  id: number;
  name: string;
  role: string;
}

function toChatMessage(row: MessageRow): ChatMessage {
  const moderatorName =
    row.moderator_first_name && row.moderator_last_name
      ? `${row.moderator_first_name} ${row.moderator_last_name}`
      : null;

  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    authorRole: row.role,
    authorName: `${row.first_name} ${row.last_name}`,
    content: row.content,
    isDeleted: Boolean(row.is_deleted),
    isModerated: Boolean(row.is_moderated),
    moderatedBy: row.moderated_by,
    moderatedByName: moderatorName,
    moderatedAt: row.moderated_at
      ? new Date(row.moderated_at).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function getEventById(eventId: number): Promise<EventRow | null> {
  const [rows] = await pool.query<EventRow[]>(
    "SELECT id, created_by FROM events WHERE id = ?",
    [eventId],
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function canAccessEventChat(
  user: TokenPayload,
  eventId: number,
): Promise<boolean> {
  const event = await getEventById(eventId);
  if (!event) {
    return false;
  }

  if (user.role === "ADMIN") {
    return true;
  }

  const [participations] = await pool.query<ParticipationRow[]>(
    `SELECT id
     FROM participations
     WHERE user_id = ? AND event_id = ? AND status = 'APPROVED'
     LIMIT 1`,
    [user.userId, eventId],
  );

  return participations.length > 0;
}

export async function canModerateEventChat(
  user: TokenPayload,
  eventId: number,
): Promise<boolean> {
  const event = await getEventById(eventId);
  if (!event) {
    return false;
  }

  if (user.role === "ADMIN") {
    return true;
  }

  return event.created_by === user.userId;
}

export async function listAccessibleChatEvents(
  user: TokenPayload,
): Promise<ChatEventSummary[]> {
  let rows: ChatEventRow[] = [];

  if (user.role === "ADMIN") {
    const [adminRows] = await pool.query<ChatEventRow[]>(
      `SELECT id, name, location, start_date, end_date, status
       FROM events
       ORDER BY start_date DESC`,
    );
    rows = adminRows;
  } else {
    const [participantRows] = await pool.query<ChatEventRow[]>(
      `SELECT e.id, e.name, e.location, e.start_date, e.end_date, e.status
       FROM events e
       INNER JOIN participations p ON p.event_id = e.id
       WHERE p.user_id = ? AND p.status = 'APPROVED'
       ORDER BY e.start_date DESC`,
      [user.userId],
    );
    rows = participantRows;
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    location: row.location,
    startDate: new Date(row.start_date).toISOString(),
    endDate: new Date(row.end_date).toISOString(),
    status: row.status,
  }));
}

export async function listEventMessages(
  eventId: number,
  limit: number = 100,
): Promise<ChatMessage[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 300);

  const [rows] = await pool.query<MessageRow[]>(
    `SELECT
      m.id,
      m.event_id,
      m.user_id,
      m.content,
      m.is_deleted,
      m.is_moderated,
      m.moderated_by,
      m.moderated_at,
      m.created_at,
      u.first_name,
      u.last_name,
      u.role,
      moderator.first_name AS moderator_first_name,
      moderator.last_name AS moderator_last_name
     FROM (
      SELECT *
      FROM messages
      WHERE event_id = ?
      ORDER BY created_at DESC
      LIMIT ?
     ) m
     JOIN users u ON u.id = m.user_id
     LEFT JOIN users moderator ON moderator.id = m.moderated_by
     ORDER BY m.created_at ASC`,
    [eventId, safeLimit],
  );

  return rows.map(toChatMessage);
}

export async function createMessage(
  eventId: number,
  userId: number,
  content: string,
): Promise<ChatMessage> {
  const [insert] = await pool.query<ResultSetHeader>(
    "INSERT INTO messages (event_id, user_id, content) VALUES (?, ?, ?)",
    [eventId, userId, content],
  );

  const [rows] = await pool.query<MessageRow[]>(
    `SELECT
      m.id,
      m.event_id,
      m.user_id,
      m.content,
      m.is_deleted,
      m.is_moderated,
      m.moderated_by,
      m.moderated_at,
      m.created_at,
      u.first_name,
      u.last_name,
      u.role,
      moderator.first_name AS moderator_first_name,
      moderator.last_name AS moderator_last_name
     FROM messages m
     JOIN users u ON u.id = m.user_id
     LEFT JOIN users moderator ON moderator.id = m.moderated_by
     WHERE m.id = ?
     LIMIT 1`,
    [insert.insertId],
  );

  if (rows.length === 0) {
    throw new Error("Message introuvable après création.");
  }

  return toChatMessage(rows[0]);
}

export async function getMessageById(
  messageId: number,
): Promise<MinimalMessageRow | null> {
  const [rows] = await pool.query<MinimalMessageRow[]>(
    "SELECT id, event_id, user_id, is_deleted FROM messages WHERE id = ? LIMIT 1",
    [messageId],
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function markMessageDeleted(messageId: number): Promise<void> {
  await pool.query("UPDATE messages SET is_deleted = TRUE WHERE id = ?", [
    messageId,
  ]);
}

export async function moderateMessage(
  messageId: number,
  moderatorUserId: number,
): Promise<void> {
  await pool.query(
    `UPDATE messages
     SET is_deleted = TRUE,
         is_moderated = TRUE,
         moderated_by = ?,
         moderated_at = NOW()
     WHERE id = ?`,
    [moderatorUserId, messageId],
  );
}

export async function listEventMembers(eventId: number): Promise<ChatMember[]> {
  const [rows] = await pool.query<(RowDataPacket & ChatMember)[]>(
    `SELECT DISTINCT
      u.id,
      CONCAT(u.first_name, ' ', u.last_name) AS name,
      u.role,
      u.first_name,
      u.last_name
     FROM users u
     WHERE u.id = (SELECT created_by FROM events WHERE id = ?)
     OR u.id IN (
       SELECT p.user_id FROM participations p
       WHERE p.event_id = ? AND p.status = 'APPROVED'
     )
     ORDER BY u.role DESC, u.first_name ASC`,
    [eventId, eventId],
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
  }));
}
