import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { ArrowLeft, Info, Smile, Send, MoreVertical, UserRound, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../../contexts/AuthContext";
import { ChatMember, ChatMessage } from "../../types/chat.types";
import {
  deleteMyMessage,
  getChatMembers,
  getChatMessages,
  moderateMessage,
} from "../../services/chat.service";
import { registerSocket } from "../../services/api";
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
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<number | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
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
    const unregisterSocket = registerSocket(socket);
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
      unregisterSocket();
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

  const insertEmoji = (emoji: string) => {
    setInput((currentValue) => {
      const inputElement = inputRef.current;
      if (!inputElement) {
        return `${currentValue}${emoji}`;
      }

      const start = inputElement.selectionStart ?? currentValue.length;
      const end = inputElement.selectionEnd ?? currentValue.length;
      const nextValue = `${currentValue.slice(0, start)}${emoji}${currentValue.slice(end)}`;

      requestAnimationFrame(() => {
        inputElement.focus();
        const nextCaretPosition = start + emoji.length;
        inputElement.setSelectionRange(nextCaretPosition, nextCaretPosition);
      });

      return nextValue;
    });

    setIsEmojiPickerOpen(false);
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
    <div className="relative h-full min-h-[calc(100dvh-12rem)] flex flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="order-1 flex items-center justify-between gap-2 w-full sm:order-2 sm:w-auto sm:justify-end">
          <button
            onClick={() => navigate("/chats")}
            className="inline-flex h-10 w-10 sm:h-11 sm:w-auto sm:px-4 items-center justify-center gap-2 rounded-xl bg-primary-accent text-white border border-primary-accent hover:bg-primary-dark transition-all font-semibold shadow-sm flex-shrink-0"
            aria-label="Retour aux chats"
            title="Retour aux chats"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">Retour aux chats</span>
          </button>
          <button
            onClick={() => setIsMembersPanelOpen(true)}
            className="h-10 w-10 sm:h-11 sm:w-11 inline-flex items-center justify-center rounded-xl border border-primary-gray/30 bg-white text-primary-dark hover:bg-primary-light/30 transition-all flex-shrink-0"
            aria-label="Afficher les membres du chat"
            title="Membres du chat"
          >
            <Info size={18} />
          </button>
        </div>

        <div className="order-2 space-y-1 sm:order-1">
          <h1 className="font-heading text-lg sm:text-2xl font-bold text-primary-dark leading-tight">
            {eventName || "Chat événementiel"}
          </h1>
          <p className="text-primary-gray text-xs sm:text-sm">Salon #{numericEventId}</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="mt-4 flex-1 min-h-0 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col min-w-0 overflow-hidden">
        <div
          className="flex-1 overflow-y-auto space-y-3 min-h-0 pb-4"
          onClick={() => setOpenMessageMenuId(null)}
        >
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
                const canManageMessage = showDelete || showModerate;
                const isMenuOpen = openMessageMenuId === message.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`relative rounded-2xl px-4 py-3 border shadow-sm max-w-[92%] sm:max-w-[78%] ${mine ? "bg-primary-accent/10 border-primary-accent/20" : "bg-white border-gray-200"}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-sm font-semibold text-primary-dark truncate">
                            {message.authorName}
                          </div>
                          {isAdmin && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full flex-shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="text-xs text-primary-gray">
                            {new Date(message.createdAt).toLocaleTimeString(
                              "fr-FR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                          {canManageMessage && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMessageMenuId((prev) =>
                                    prev === message.id ? null : message.id,
                                  );
                                }}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-primary-gray hover:bg-primary-gray/10 hover:text-primary-dark"
                                aria-label="Actions du message"
                              >
                                <MoreVertical size={15} />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-0 top-8 min-w-36 rounded-xl border border-primary-gray/20 bg-white shadow-lg z-10 p-1">
                                  {showDelete && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        void handleDelete(message);
                                        setOpenMessageMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm rounded-lg text-red-600 hover:bg-red-50"
                                    >
                                      Supprimer
                                    </button>
                                  )}
                                  {showModerate && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        void handleModerate(message);
                                        setOpenMessageMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm rounded-lg text-orange-700 hover:bg-orange-50"
                                    >
                                      Modérer
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <p
                        className={`mt-2 text-sm leading-relaxed break-words ${message.isDeleted ? "text-gray-400 italic" : "text-primary-dark"}`}
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
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

      <div className="mt-auto sticky bottom-0 z-20 pt-4 pb-2 sm:pb-0">
        <form
          onSubmit={handleSend}
          className="relative bg-white/95 backdrop-blur border border-gray-200 shadow-lg rounded-2xl p-2 sm:p-3 flex flex-row items-center gap-2"
        >
          {isEmojiPickerOpen && (
            <div className="absolute left-3 right-3 bottom-full mb-3 z-30 rounded-2xl border border-primary-gray/15 bg-white shadow-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
                  Emojis
                </span>
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(false)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-primary-gray hover:bg-primary-gray/10"
                  aria-label="Fermer le sélecteur d'emojis"
                >
                  <X size={14} />
                </button>
              </div>
              <EmojiPicker
                onEmojiClick={(emojiData) => insertEmoji(emojiData.emoji)}
                width="100%"
                height={340}
                searchDisabled={false}
                skinTonesDisabled={false}
                lazyLoadEmojis
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
              className="h-10 w-10 sm:h-11 sm:w-11 inline-flex items-center justify-center rounded-xl border border-primary-gray/20 bg-white text-primary-accent hover:bg-primary-accent hover:text-white transition-all flex-shrink-0"
              aria-label="Ouvrir le sélecteur d'emojis"
              title="Emojis"
            >
              <Smile size={18} />
            </button>
          </div>

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={2000}
            placeholder="Écrire un message..."
            className="min-w-0 flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-accent"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="h-10 w-10 sm:h-11 sm:w-auto sm:px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-accent text-white font-semibold disabled:opacity-50 flex-shrink-0"
          >
            <Send size={17} />
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </form>
      </div>

      {isMembersPanelOpen && (
        <>
          <button
            type="button"
            onClick={() => setIsMembersPanelOpen(false)}
            className="absolute inset-0 bg-primary-dark/25 rounded-2xl z-30"
            aria-label="Fermer le panneau des membres"
          />

          <aside
            className="absolute top-0 right-0 h-full w-full max-w-sm z-40"
            aria-hidden={!isMembersPanelOpen}
          >
            <div className="h-full bg-white border-l border-primary-gray/20 shadow-2xl rounded-r-2xl sm:rounded-l-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-primary-gray/15 bg-gradient-to-r from-primary-light/20 to-primary-white flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-primary-dark">Membres du chat</h2>
                  <p className="text-xs text-primary-gray">{members.length} participant{members.length > 1 ? "s" : ""}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMembersPanelOpen(false)}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-primary-gray/20 text-primary-dark hover:bg-primary-light/30"
                  aria-label="Fermer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-white to-primary-light/10">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-primary-gray/15 bg-white hover:border-primary-accent/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary-accent/10 text-primary-accent inline-flex items-center justify-center flex-shrink-0">
                        <UserRound size={17} />
                      </div>
                      <span className="text-sm font-medium text-primary-dark truncate">{member.name}</span>
                    </div>
                    {member.role === "ADMIN" && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default EventChatPage;
