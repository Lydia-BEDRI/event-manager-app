export type NotificationType =
  | "PARTICIPATION_REQUEST"
  | "PARTICIPATION_APPROVED"
  | "PARTICIPATION_REFUSED"
  | "EVENT_UPDATE"
  | "CHAT_MENTION"
  | "SYSTEM";

export interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string | null;
  type: NotificationType;
  referenceType: string | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
