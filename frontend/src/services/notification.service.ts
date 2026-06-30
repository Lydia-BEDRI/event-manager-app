import { api } from "./api";
import {
  Notification,
  NotificationPage,
  NotificationType,
} from "../types/notification.types";

interface ApiNotification {
  id: number;
  user_id: number;
  title: string;
  body: string | null;
  type: NotificationType;
  reference_type: string | null;
  reference_id: number | null;
  is_read: boolean | number;
  created_at: string;
}

interface ApiNotificationPage extends Omit<NotificationPage, "notifications"> {
  notifications: ApiNotification[];
}

function token(): string {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    throw new Error("Token manquant. Veuillez vous reconnecter.");
  }
  return accessToken;
}

export function normalizeNotification(value: ApiNotification): Notification {
  return {
    id: value.id,
    userId: value.user_id,
    title: value.title,
    body: value.body,
    type: value.type,
    referenceType: value.reference_type,
    referenceId: value.reference_id,
    isRead: Boolean(value.is_read),
    createdAt: value.created_at,
  };
}

export async function getNotifications(): Promise<NotificationPage> {
  const response = await api.get<ApiNotificationPage>(
    "/notifications?limit=20",
    token(),
  );
  return {
    ...response,
    notifications: response.notifications.map(normalizeNotification),
  };
}

export async function markNotificationRead(id: number): Promise<Notification> {
  const response = await api.patch<{ notification: ApiNotification }>(
    `/notifications/${id}/read`,
    {},
    token(),
  );
  return normalizeNotification(response.notification);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch<{ updatedCount: number }>(
    "/notifications/read-all",
    {},
    token(),
  );
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete<{ success: boolean }>(`/notifications/${id}`, token());
}

export type { ApiNotification };
