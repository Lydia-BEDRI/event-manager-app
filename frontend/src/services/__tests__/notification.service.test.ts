/// <reference types="jest" />

import { api } from "../api";
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../notification.service";

jest.mock("../api", () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const rawNotification = {
  id: 1,
  user_id: 3,
  title: "Participation approuvée",
  body: "Votre participation est approuvée.",
  type: "PARTICIPATION_APPROVED" as const,
  reference_type: "participation",
  reference_id: 9,
  is_read: 0,
  created_at: "2026-06-30T12:00:00.000Z",
};

describe("notification.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("accessToken", "token-test");
  });

  afterEach(() => localStorage.clear());

  it("charge et normalise les notifications", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      notifications: [rawNotification],
      unreadCount: 1,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const result = await getNotifications();

    expect(api.get).toHaveBeenCalledWith("/notifications?limit=20", "token-test");
    expect(result.notifications[0]).toEqual(expect.objectContaining({
      userId: 3,
      referenceId: 9,
      isRead: false,
    }));
  });

  it("marque une notification comme lue", async () => {
    (api.patch as jest.Mock).mockResolvedValueOnce({
      notification: { ...rawNotification, is_read: 1 },
    });
    const result = await markNotificationRead(1);
    expect(api.patch).toHaveBeenCalledWith("/notifications/1/read", {}, "token-test");
    expect(result.isRead).toBe(true);
  });

  it("marque tout comme lu et supprime", async () => {
    (api.patch as jest.Mock).mockResolvedValueOnce({ updatedCount: 2 });
    (api.delete as jest.Mock).mockResolvedValueOnce({ success: true });

    await markAllNotificationsRead();
    await deleteNotification(1);

    expect(api.patch).toHaveBeenCalledWith("/notifications/read-all", {}, "token-test");
    expect(api.delete).toHaveBeenCalledWith("/notifications/1", "token-test");
  });

  it("refuse un appel sans token", async () => {
    localStorage.clear();
    await expect(getNotifications()).rejects.toThrow("Token manquant");
  });
});
