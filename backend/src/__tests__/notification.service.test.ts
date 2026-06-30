import pool from "../config/database";
import {
  createNotification,
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification.service";

jest.mock("../config/database", () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

const query = pool.query as jest.Mock;

describe("notification.service", () => {
  beforeEach(() => jest.clearAllMocks());

  it("crée puis retourne une notification", async () => {
    const created = { id: 12, user_id: 3, title: "Test" };
    query
      .mockResolvedValueOnce([{ insertId: 12 }])
      .mockResolvedValueOnce([[created]]);

    await expect(createNotification({
      userId: 3,
      title: "Test",
      type: "SYSTEM",
    })).resolves.toEqual(created);

    expect(query.mock.calls[0][1]).toEqual([3, "Test", null, "SYSTEM", null, null]);
    expect(query.mock.calls[1][1]).toEqual([12, 3]);
  });

  it("retourne une page et le compteur non lu", async () => {
    query
      .mockResolvedValueOnce([[{ total: 2 }]])
      .mockResolvedValueOnce([[{ id: 2 }, { id: 1 }]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    const result = await listNotifications(3, 2, 10, false);

    expect(result.pagination).toEqual({ page: 2, limit: 10, total: 2, totalPages: 1 });
    expect(result.unreadCount).toBe(1);
    expect(query.mock.calls[1][1]).toEqual([3, 10, 10]);
  });

  it("applique le filtre non lu", async () => {
    query
      .mockResolvedValueOnce([[{ total: 0 }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await listNotifications(3, 1, 20, true);

    expect(query.mock.calls[0][0]).toContain("is_read = FALSE");
    expect(query.mock.calls[1][0]).toContain("is_read = FALSE");
  });

  it("compte les notifications non lues", async () => {
    query.mockResolvedValueOnce([[{ total: "4" }]]);
    await expect(getUnreadCount(3)).resolves.toBe(4);
  });

  it("ne marque pas la notification d’un autre utilisateur", async () => {
    query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    await expect(markNotificationAsRead(9, 3)).resolves.toBeNull();
    expect(query).toHaveBeenCalledWith(expect.any(String), [9, 3]);
  });

  it("marque toutes les notifications de l’utilisateur", async () => {
    query.mockResolvedValueOnce([{ affectedRows: 3 }]);
    await expect(markAllNotificationsAsRead(3)).resolves.toBe(3);
    expect(query).toHaveBeenCalledWith(expect.any(String), [3]);
  });

  it("supprime uniquement une notification possédée", async () => {
    query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await expect(deleteNotification(7, 3)).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(expect.any(String), [7, 3]);
  });
});
