import React, { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import {
  ApiNotification,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  normalizeNotification,
} from "../../services/notification.service";
import { Notification } from "../../types/notification.types";

const socketUrl = (
  process.env.REACT_APP_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const NotificationBell: React.FC = () => {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError("");
    try {
      const result = await getNotifications();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch {
      setError("Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = io(socketUrl, { auth: { token: accessToken } });
    socket.on(
      "notification:new",
      (payload: { notification: ApiNotification }) => {
        const notification = normalizeNotification(payload.notification);
        setNotifications((current) => [
          notification,
          ...current.filter((item) => item.id !== notification.id),
        ]);
        setUnreadCount((count) => count + (notification.isRead ? 0 : 1));
      },
    );
    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  const destination = (notification: Notification): string | null => {
    if (notification.type === "CHAT_MENTION" && notification.referenceId) {
      return `/chats/${notification.referenceId}`;
    }
    if (notification.type === "PARTICIPATION_REQUEST") return "/participants";
    if (
      notification.type === "PARTICIPATION_APPROVED" ||
      notification.type === "PARTICIPATION_REFUSED" ||
      notification.type === "EVENT_UPDATE"
    ) {
      return user?.role === "ADMIN" ? "/events" : "/my-participations";
    }
    return null;
  };

  const selectNotification = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        setError("Impossible de marquer la notification comme lue.");
        return;
      }
    }
    const path = destination(notification);
    if (path) {
      setOpen(false);
      navigate(path);
    }
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadCount(0);
    } catch {
      setError("Impossible de marquer les notifications comme lues.");
    }
  };

  const remove = async (event: React.MouseEvent, id: number) => {
    event.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((current) => {
        const removed = current.find((item) => item.id === id);
        if (removed && !removed.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return current.filter((item) => item.id !== id);
      });
    } catch {
      setError("Impossible de supprimer la notification.");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative p-1.5 sm:p-2 hover:bg-primary-gray/10 rounded-full transition-colors border border-primary-gray/30"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} non lue(s)` : ""}`}
        aria-expanded={open}
      >
        <Bell className="text-primary-dark" size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-primary-accent text-white text-[10px] font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 p-3">
            <strong>Notifications</strong>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button type="button" onClick={readAll} className="p-1.5" aria-label="Tout marquer comme lu">
                  <CheckCheck size={18} />
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="p-1.5" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && <p className="p-4 text-sm text-primary-gray">Chargement...</p>}
            {!loading && error && <p role="alert" className="p-4 text-sm text-red-800">{error}</p>}
            {!loading && !error && notifications.length === 0 && (
              <p className="p-4 text-sm text-primary-gray">Aucune notification.</p>
            )}
            {!loading && notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex w-full items-start border-b border-gray-100 ${notification.isRead ? "bg-white" : "bg-sky-50"}`}
              >
                <button
                  type="button"
                  onClick={() => selectNotification(notification)}
                  className="min-w-0 flex-1 p-3 text-left"
                >
                  <span className="block text-sm font-semibold text-primary-dark">{notification.title}</span>
                  {notification.body && <span className="mt-1 block text-xs text-primary-gray">{notification.body}</span>}
                  <span className="mt-1 block text-[11px] text-primary-gray">
                    {new Date(notification.createdAt).toLocaleString("fr-FR")}
                  </span>
                </button>
                <button type="button" onClick={(event) => remove(event, notification.id)} className="m-2 p-1" aria-label="Supprimer la notification">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
