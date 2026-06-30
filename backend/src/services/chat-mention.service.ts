import { RowDataPacket } from "mysql2";
import pool from "../config/database";
import { ChatMessage } from "./chat.service";
import { createNotification, Notification } from "./notification.service";

interface MentionedMember extends RowDataPacket {
  id: number;
}

const MENTION_PATTERN = /@\[[^\]\r\n]{1,100}\]\(user:(\d+)\)/g;

export async function notifyChatMentions(
  message: ChatMessage,
  onCreated: (notification: Notification) => void,
): Promise<void> {
  const mentionedIds = new Set<number>();
  for (const match of message.content.matchAll(MENTION_PATTERN)) {
    const userId = Number(match[1]);
    if (Number.isInteger(userId) && userId !== message.userId) {
      mentionedIds.add(userId);
    }
  }

  if (mentionedIds.size === 0) {
    return;
  }

  const ids = [...mentionedIds];
  const placeholders = ids.map(() => "?").join(", ");
  const [members] = await pool.query<MentionedMember[]>(
    `SELECT DISTINCT u.id
     FROM users u
     LEFT JOIN participations p
       ON p.user_id = u.id AND p.event_id = ? AND p.status = 'APPROVED'
     WHERE u.id IN (${placeholders})
       AND (u.role = 'ADMIN' OR p.id IS NOT NULL)`,
    [message.eventId, ...ids],
  );

  const notifications = await Promise.all(
    members.map((member) => createNotification({
      userId: member.id,
      title: "Vous avez été mentionné(e)",
      body: `${message.authorName} vous a mentionné(e) dans le chat.`,
      type: "CHAT_MENTION",
      referenceType: "event",
      referenceId: message.eventId,
    })),
  );
  notifications.forEach(onCreated);
}
