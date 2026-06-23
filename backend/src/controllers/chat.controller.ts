import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate";
import {
  canAccessEventChat,
  canModerateEventChat,
  createMessage,
  getEventById,
  getMessageById,
  listAccessibleChatEvents,
  listEventMessages,
  listEventMembers,
  markMessageDeleted,
  moderateMessage,
} from "../services/chat.service";
import {
  emitMessageDeleted,
  emitMessageUpdated,
  emitNewMessage,
} from "../sockets/server.socket";

function parseEventId(value: string): number {
  return Number.parseInt(value, 10);
}

function parseMessageId(value: string): number {
  return Number.parseInt(value, 10);
}

export async function getMessages(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  const eventId = parseEventId(req.params.eventId);
  const limit = req.query.limit
    ? Number.parseInt(String(req.query.limit), 10)
    : 100;

  if (Number.isNaN(eventId)) {
    res.status(400).json({ error: "eventId invalide." });
    return;
  }

  try {
    const event = await getEventById(eventId);
    if (!event) {
      res.status(404).json({ error: "Événement introuvable." });
      return;
    }

    const canAccess = await canAccessEventChat(req.user, eventId);
    if (!canAccess) {
      res.status(403).json({ error: "Accès refusé au chat de cet événement." });
      return;
    }

    const messages = await listEventMessages(
      eventId,
      Number.isNaN(limit) ? 100 : limit,
    );
    res.json({ messages });
  } catch (error) {
    console.error("Erreur getMessages:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function getChatEvents(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  try {
    const events = await listAccessibleChatEvents(req.user);
    res.json({ events });
  } catch (error) {
    console.error("Erreur getChatEvents:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function postMessage(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  const eventId = parseEventId(req.params.eventId);
  const rawContent = String(req.body.content || "");
  const content = rawContent.trim();

  if (Number.isNaN(eventId)) {
    res.status(400).json({ error: "eventId invalide." });
    return;
  }

  if (!content) {
    res.status(400).json({ error: "Le message ne peut pas être vide." });
    return;
  }

  if (content.length > 2000) {
    res.status(400).json({ error: "Le message dépasse 2000 caractères." });
    return;
  }

  try {
    const event = await getEventById(eventId);
    if (!event) {
      res.status(404).json({ error: "Événement introuvable." });
      return;
    }

    const canAccess = await canAccessEventChat(req.user, eventId);
    if (!canAccess) {
      res.status(403).json({ error: "Accès refusé au chat de cet événement." });
      return;
    }

    const message = await createMessage(eventId, req.user.userId, content);
    emitNewMessage(eventId, message);

    res.status(201).json({ message });
  } catch (error) {
    console.error("Erreur postMessage:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function deleteOwnMessage(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  const messageId = parseMessageId(req.params.messageId);

  if (Number.isNaN(messageId)) {
    res.status(400).json({ error: "messageId invalide." });
    return;
  }

  try {
    const message = await getMessageById(messageId);
    if (!message) {
      res.status(404).json({ error: "Message introuvable." });
      return;
    }

    if (message.is_deleted) {
      res.status(409).json({ error: "Message déjà supprimé." });
      return;
    }

    if (message.user_id !== req.user.userId) {
      res
        .status(403)
        .json({ error: "Vous ne pouvez supprimer que vos messages." });
      return;
    }

    await markMessageDeleted(messageId);
    emitMessageDeleted(message.event_id, messageId);
    emitMessageUpdated(message.event_id, { id: messageId, isDeleted: true });

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur deleteOwnMessage:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function moderateChatMessage(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  const messageId = parseMessageId(req.params.messageId);

  if (Number.isNaN(messageId)) {
    res.status(400).json({ error: "messageId invalide." });
    return;
  }

  try {
    const message = await getMessageById(messageId);
    if (!message) {
      res.status(404).json({ error: "Message introuvable." });
      return;
    }

    if (message.is_deleted) {
      res.status(409).json({ error: "Message déjà supprimé." });
      return;
    }

    const canModerate = await canModerateEventChat(req.user, message.event_id);
    if (!canModerate) {
      res.status(403).json({ error: "Vous ne pouvez pas modérer ce chat." });
      return;
    }

    await moderateMessage(messageId, req.user.userId);
    emitMessageDeleted(message.event_id, messageId);
    emitMessageUpdated(message.event_id, {
      id: messageId,
      isDeleted: true,
      isModerated: true,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erreur moderateChatMessage:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function getMembers(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Non authentifié." });
    return;
  }

  const eventId = parseEventId(req.params.eventId);

  if (Number.isNaN(eventId)) {
    res.status(400).json({ error: "eventId invalide." });
    return;
  }

  try {
    const event = await getEventById(eventId);
    if (!event) {
      res.status(404).json({ error: "Événement introuvable." });
      return;
    }

    const canAccess = await canAccessEventChat(req.user, eventId);
    if (!canAccess) {
      res.status(403).json({ error: "Accès refusé au chat de cet événement." });
      return;
    }

    const members = await listEventMembers(eventId);
    res.json({ members });
  } catch (error) {
    console.error("Erreur getMembers:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}
