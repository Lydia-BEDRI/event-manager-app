import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import { ChatMember, ChatMessage } from "../../types/chat.types";
import {
  deleteMyMessage,
  getChatMembers,
  getChatMessages,
  moderateMessage,
} from "../../services/chat.service";
import { getEventById } from "../../services/event.service";

// Utility functions defined outside component to avoid dependency array issues
const normalizeText = (value: string): string => {
  const looksMojibake =
    value.includes("Ã") ||
    value.includes("Â") ||
    value.includes("â€™") ||
    value.includes("â€œ") ||
    value.includes("â€");

  if (!value || !looksMojibake) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return value;
  }
};

const normalizeMessage = (message: ChatMessage): ChatMessage => ({
  ...message,
  authorName: normalizeText(message.authorName),
  content: normalizeText(message.content),
  moderatedByName: message.moderatedByName
    ? normalizeText(message.moderatedByName)
    : null,
});

const EventChatPage: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const numericEventId = useMemo(
    () => Number.parseInt(eventId || "", 10),
    [eventId],
  );
  const [eventName, setEventName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const socketUrl = (
    process.env.REACT_APP_API_URL || "http://localhost:5000/api"
  ).replace(/\/api\/?$/, "");

  const canModerate = user?.role === "ADMIN";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!Number.isInteger(numericEventId)) {
      setError("Événement invalide.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const [event, initialMessages, eventMembers] = await Promise.all([
          getEventById(numericEventId),
          getChatMessages(numericEventId),
          getChatMembers(numericEventId),
        ]);

        if (!active) {
          return;
        }

        setEventName(normalizeText(event.name));
        setMessages(initialMessages.map(normalizeMessage));
        setMembers(
          eventMembers.map((member) => ({
            ...member,
            name: normalizeText(member.name),
          })),
        );
      } catch (err: any) {
        if (!active) {
          return;
        }
        setError(err.message || "Impossible de charger le chat.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    const socket = io(socketUrl, {
      auth: { token },
      timeout: 8000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("chat:join", { eventId: numericEventId });
    });

    socket.on("chat:error", (payload: { message?: string }) => {
      setError(payload?.message || "Erreur chat.");
    });

    socket.on("connect_error", () => {
      setError((prev) => prev || "Connexion temps réel indisponible.");
    });

    socket.on("chat:message:new", (payload: { message: ChatMessage }) => {
      const normalized = normalizeMessage(payload.message);
      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === normalized.id);
        if (exists) {
          return prev;
        }
        return [...prev, normalized];
      });
    });

    socket.on("chat:message:deleted", (payload: { messageId: number }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === payload.messageId
            ? { ...msg, isDeleted: true, content: "[message supprimé]" }
            : msg,
        ),
      );
    });

    socket.on(
      "chat:message:updated",
      (payload: Partial<ChatMessage> & { id: number }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === payload.id ? { ...msg, ...payload } : msg,
          ),
        );
      },
    );

    return () => {
      active = false;
      socket.emit("chat:leave", { eventId: numericEventId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [navigate, numericEventId, socketUrl]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();

    if (!content || content.length > 2000) {
      return;
    }

    setSending(true);
    setError("");

    try {
      socketRef.current?.emit("chat:send", {
        eventId: numericEventId,
        content,
      });
      setInput("");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (message: ChatMessage) => {
    try {
      await deleteMyMessage(message.id);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? { ...msg, isDeleted: true, content: "[message supprimé]" }
            : msg,
        ),
      );
    } catch (err: any) {
      setError(err.message || "Suppression impossible.");
    }
  };

  const handleModerate = async (message: ChatMessage) => {
    try {
      await moderateMessage(message.id);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? {
                ...msg,
                isDeleted: true,
                isModerated: true,
                content: "[message modéré]",
                moderatedByName: user
                  ? `${user.firstName} ${user.lastName}`
                  : msg.moderatedByName,
              }
            : msg,
        ),
      );
    } catch (err: any) {
      setError(err.message || "Modération impossible.");
    }
  };

  if (loading) {
    return <div className="text-primary-gray">Chargement du chat...</div>;
  }

  return (
    <div className="space-y-4 h-full flex flex-col max-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary-dark">
            {eventName || "Chat événementiel"}
          </h1>
          <p className="text-primary-gray text-sm">Salon #{numericEventId}</p>
        </div>
        <button
          onClick={() => navigate("/chats")}
          className="px-4 py-2 rounded-xl border border-gray-300 text-primary-dark hover:bg-gray-50"
        >
          Retour aux chats
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {messages.length === 0 ? (
              <p className="text-primary-gray text-sm">
                Aucun message pour le moment.
              </p>
            ) : (
              messages.map((message) => {
                const mine = message.userId === user?.id;
                const showDelete = mine && !message.isDeleted;
                const showModerate = canModerate && !mine && !message.isDeleted;
                const isAdmin = message.authorRole === "ADMIN";

                return (
                  <div
                    key={message.id}
                    className={`rounded-xl px-4 py-3 border ${mine ? "bg-primary-accent/10 border-primary-accent/20" : "bg-white border-gray-200"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-primary-dark">
                          {message.authorName}
                        </div>
                        {isAdmin && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-primary-gray">
                        {new Date(message.createdAt).toLocaleTimeString(
                          "fr-FR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </div>
                    </div>

                    <p
                      className={`mt-1 text-sm ${message.isDeleted ? "text-gray-400 italic" : "text-primary-dark"}`}
                    >
                      {message.isDeleted
                        ? message.isModerated
                          ? "[message modéré]"
                          : "[message supprimé]"
                        : message.content}
                    </p>

                    {message.isModerated && message.moderatedByName && (
                      <p className="mt-1 text-xs text-orange-600">
                        Modéré par l'administrateur {message.moderatedByName}
                      </p>
                    )}

                    {(showDelete || showModerate) && (
                      <div className="mt-2 flex items-center gap-2">
                        {showDelete && (
                          <button
                            onClick={() => handleDelete(message)}
                            className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        )}
                        {showModerate && (
                          <button
                            onClick={() => handleModerate(message)}
                            className="text-xs px-2 py-1 rounded border border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            Modérer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="w-64 bg-white border border-gray-200 rounded-2xl p-4 flex flex-col">
          <h2 className="font-semibold text-primary-dark mb-3">
            Membres ({members.length})
          </h2>
          <div className="flex-1 overflow-y-auto space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm text-primary-dark">{member.name}</span>
                {member.role === "ADMIN" && (
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSend}
        className="bg-white border border-gray-200 rounded-2xl p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
          placeholder="Écrire un message..."
          className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-accent"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-5 py-2 rounded-xl bg-primary-accent text-white disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
};

export default EventChatPage;
