/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import NotificationBell from "../NotificationBell";
import * as notificationService from "../../../services/notification.service";
import { io } from "socket.io-client";

const mockSocketHandlers: Record<string, (payload: any) => void> = {};
const mockDisconnect = jest.fn();

jest.mock("socket.io-client", () => ({
  io: jest.fn(),
}));

jest.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "token-test",
    user: { id: 3, firstName: "Charlie", lastName: "Durand", role: "PARTICIPANT" },
  }),
}));

jest.mock("../../../services/notification.service");

const notification = {
  id: 1,
  userId: 3,
  title: "Participation approuvée",
  body: "Votre demande est acceptée.",
  type: "PARTICIPATION_APPROVED" as const,
  referenceType: "participation",
  referenceId: 9,
  isRead: false,
  createdAt: "2026-06-30T12:00:00.000Z",
};

describe("NotificationBell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockSocketHandlers).forEach((key) => delete mockSocketHandlers[key]);
    (io as jest.Mock).mockReturnValue({
      on: jest.fn((event: string, handler: (payload: any) => void) => {
        mockSocketHandlers[event] = handler;
      }),
      disconnect: mockDisconnect,
    });
    (notificationService.getNotifications as jest.Mock).mockResolvedValue({
      notifications: [notification],
      unreadCount: 1,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    (notificationService.normalizeNotification as jest.Mock).mockImplementation((value) => value);
  });

  const renderBell = () => render(
    <BrowserRouter>
      <NotificationBell />
    </BrowserRouter>,
  );

  it("affiche le compteur et la liste chargée", async () => {
    renderBell();
    await waitFor(() => expect(screen.getByLabelText("Notifications, 1 non lue(s)")).toBeTruthy());
    fireEvent.click(screen.getByLabelText("Notifications, 1 non lue(s)"));
    expect(await screen.findByText("Participation approuvée")).toBeTruthy();
  });

  it("marque toutes les notifications comme lues", async () => {
    (notificationService.markAllNotificationsRead as jest.Mock).mockResolvedValue(undefined);
    renderBell();
    const bell = await screen.findByLabelText("Notifications, 1 non lue(s)");
    fireEvent.click(bell);
    fireEvent.click(screen.getByLabelText("Tout marquer comme lu"));

    await waitFor(() => expect(screen.getByLabelText("Notifications")).toBeTruthy());
  });

  it("ajoute une notification reçue par Socket.IO", async () => {
    (notificationService.getNotifications as jest.Mock).mockResolvedValueOnce({
      notifications: [], unreadCount: 0,
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    const live = { ...notification, id: 2, title: "Événement modifié" };
    renderBell();
    await waitFor(() => expect(mockSocketHandlers["notification:new"]).toBeDefined());

    act(() => {
      mockSocketHandlers["notification:new"]({ notification: live });
    });

    await waitFor(() => expect(screen.getByLabelText("Notifications, 1 non lue(s)")).toBeTruthy());
    fireEvent.click(screen.getByLabelText("Notifications, 1 non lue(s)"));
    expect(screen.getByText("Événement modifié")).toBeTruthy();
  });
});
