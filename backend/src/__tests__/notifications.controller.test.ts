import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authenticate";
import {
  createSystemNotification,
  getNotifications,
  readAllNotifications,
  readNotification,
  removeNotification,
} from "../controllers/notifications.controller";
import * as notificationService from "../services/notification.service";
import pool from "../config/database";
import { emitNotification } from "../sockets/server.socket";

jest.mock("../services/notification.service");
jest.mock("../config/database", () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock("../sockets/server.socket", () => ({
  emitNotification: jest.fn(),
}));

describe("notifications.controller", () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    req = {
      user: { userId: 3, role: "PARTICIPANT" },
      params: {},
      query: {},
      body: {},
    };
    res = { json, status };
    jest.clearAllMocks();
  });

  it("borne la pagination à 100 éléments", async () => {
    const page = {
      notifications: [], unreadCount: 0,
      pagination: { page: 2, limit: 100, total: 0, totalPages: 0 },
    };
    (notificationService.listNotifications as jest.Mock).mockResolvedValueOnce(page);
    req.query = { page: "2", limit: "999", unreadOnly: "true" };

    await getNotifications(req as AuthenticatedRequest, res as Response);

    expect(notificationService.listNotifications).toHaveBeenCalledWith(3, 2, 100, true);
    expect(json).toHaveBeenCalledWith(page);
  });

  it("retourne 404 pour une notification non possédée", async () => {
    req.params = { notificationId: "42" };
    (notificationService.markNotificationAsRead as jest.Mock).mockResolvedValueOnce(null);

    await readNotification(req as AuthenticatedRequest, res as Response);

    expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith(42, 3);
    expect(status).toHaveBeenCalledWith(404);
  });

  it("marque toutes les notifications comme lues", async () => {
    (notificationService.markAllNotificationsAsRead as jest.Mock).mockResolvedValueOnce(4);
    await readAllNotifications(req as AuthenticatedRequest, res as Response);
    expect(json).toHaveBeenCalledWith({ updatedCount: 4 });
  });

  it("supprime une notification possédée", async () => {
    req.params = { notificationId: "8" };
    (notificationService.deleteNotification as jest.Mock).mockResolvedValueOnce(true);
    await removeNotification(req as AuthenticatedRequest, res as Response);
    expect(json).toHaveBeenCalledWith({ success: true });
  });

  it("crée une notification système pour un rôle et la diffuse", async () => {
    req.user = { userId: 1, role: "ADMIN" };
    req.body = { title: "Maintenance", body: "À 20 h", target: "PARTICIPANT" };
    (pool.query as jest.Mock).mockResolvedValueOnce([[{ id: 3 }, { id: 4 }]]);
    (notificationService.createNotification as jest.Mock)
      .mockResolvedValueOnce({ id: 1, user_id: 3 })
      .mockResolvedValueOnce({ id: 2, user_id: 4 });

    await createSystemNotification(req as AuthenticatedRequest, res as Response);

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("role = ?"), ["PARTICIPANT"]);
    expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
    expect(emitNotification).toHaveBeenCalledTimes(2);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ createdCount: 2 });
  });

  it("refuse une cible système invalide", async () => {
    req.body = { title: "Maintenance", target: "INCONNU" };
    await createSystemNotification(req as AuthenticatedRequest, res as Response);
    expect(status).toHaveBeenCalledWith(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});
