import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import {
  canAccessEventChat,
  ChatMessage,
  createMessage,
  getEventById,
} from "../services/chat.service";
import { TokenPayload } from "../utils/jwt";

interface AuthenticatedSocket extends Socket {
  data: {
    user?: TokenPayload;
  };
}

interface JoinPayload {
  eventId: number;
}

interface SendPayload {
  eventId: number;
  content: string;
}

let io: Server | null = null;

function roomName(eventId: number): string {
  return `event:${eventId}`;
}

function emitSocketError(socket: Socket, message: string): void {
  socket.emit("chat:error", { message });
}

export function initSocketServer(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers.authorization;
    const rawToken =
      typeof token === "string" ? token.replace("Bearer ", "").trim() : "";

    if (!rawToken) {
      next(new Error("Token manquant."));
      return;
    }

    try {
      const decoded = verifyToken(rawToken);
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Token invalide."));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    socket.on("chat:join", async (payload: JoinPayload) => {
      const user = socket.data.user;
      const eventId = Number(payload?.eventId);

      if (!user) {
        emitSocketError(socket, "Non authentifié.");
        return;
      }

      if (!Number.isInteger(eventId)) {
        emitSocketError(socket, "eventId invalide.");
        return;
      }

      try {
        const event = await getEventById(eventId);
        if (!event) {
          emitSocketError(socket, "Événement introuvable.");
          return;
        }

        const allowed = await canAccessEventChat(user, eventId);
        if (!allowed) {
          emitSocketError(socket, "Accès refusé au chat.");
          return;
        }

        socket.join(roomName(eventId));
        socket.emit("chat:joined", { eventId });
      } catch {
        emitSocketError(socket, "Erreur serveur.");
      }
    });

    socket.on("chat:leave", (payload: JoinPayload) => {
      const eventId = Number(payload?.eventId);

      if (!Number.isInteger(eventId)) {
        return;
      }

      socket.leave(roomName(eventId));
      socket.emit("chat:left", { eventId });
    });

    socket.on("chat:send", async (payload: SendPayload) => {
      const user = socket.data.user;
      const eventId = Number(payload?.eventId);
      const content = String(payload?.content || "").trim();

      if (!user) {
        emitSocketError(socket, "Non authentifié.");
        return;
      }

      if (!Number.isInteger(eventId)) {
        emitSocketError(socket, "eventId invalide.");
        return;
      }

      if (!content || content.length > 2000) {
        emitSocketError(socket, "Message invalide.");
        return;
      }

      try {
        const allowed = await canAccessEventChat(user, eventId);
        if (!allowed) {
          emitSocketError(socket, "Accès refusé au chat.");
          return;
        }

        const message = await createMessage(eventId, user.userId, content);
        io?.to(roomName(eventId)).emit("chat:message:new", { message });
      } catch {
        emitSocketError(socket, "Erreur serveur.");
      }
    });
  });

  return io;
}

export function emitNewMessage(eventId: number, message: ChatMessage): void {
  io?.to(roomName(eventId)).emit("chat:message:new", { message });
}

export function emitMessageDeleted(eventId: number, messageId: number): void {
  io?.to(roomName(eventId)).emit("chat:message:deleted", { messageId });
}

export function emitMessageUpdated(
  eventId: number,
  payload: Record<string, unknown>,
): void {
  io?.to(roomName(eventId)).emit("chat:message:updated", payload);
}
