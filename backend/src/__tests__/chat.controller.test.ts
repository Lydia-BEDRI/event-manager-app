import { Response } from "express";
import {
  deleteOwnMessage,
  getChatEvents,
  getMessages,
  moderateChatMessage,
  postMessage,
} from "../controllers/chat.controller";
import { AuthenticatedRequest } from "../middlewares/authenticate";
import * as chatService from "../services/chat.service";
import * as socketServer from "../sockets/server.socket";

jest.mock("../services/chat.service");
jest.mock("../sockets/server.socket");

describe("Chat Controller", () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });

    mockRequest = {
      params: {},
      query: {},
      body: {},
      user: {
        userId: 3,
        email: "participant@test.fr",
        role: "PARTICIPANT",
      },
    };

    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };

    jest.clearAllMocks();
  });

  it("retourne 401 sans utilisateur pour getChatEvents", async () => {
    mockRequest.user = undefined;

    await getChatEvents(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
    );

    expect(responseStatus).toHaveBeenCalledWith(401);
  });

  it("retourne les événements accessibles", async () => {
    (chatService.listAccessibleChatEvents as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        name: "Conf Tech",
        location: "Paris",
        startDate: "2026-04-15T09:00:00.000Z",
        endDate: "2026-04-15T18:00:00.000Z",
        status: "PUBLISHED",
      },
    ]);

    await getChatEvents(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
    );

    expect(responseJson).toHaveBeenCalledWith({ events: expect.any(Array) });
  });

  it("refuse la lecture des messages sans accès", async () => {
    mockRequest.params = { eventId: "1" };
    (chatService.getEventById as jest.Mock).mockResolvedValueOnce({
      id: 1,
      created_by: 2,
    });
    (chatService.canAccessEventChat as jest.Mock).mockResolvedValueOnce(false);

    await getMessages(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
    );

    expect(responseStatus).toHaveBeenCalledWith(403);
  });

  it("crée un message et diffuse via socket", async () => {
    mockRequest.params = { eventId: "1" };
    mockRequest.body = { content: "Bonjour la team" };

    const created = {
      id: 10,
      eventId: 1,
      userId: 3,
      authorName: "John Doe",
      content: "Bonjour la team",
      isDeleted: false,
      isModerated: false,
      moderatedBy: null,
      moderatedByName: null,
      moderatedAt: null,
      createdAt: "2026-03-29T12:00:00.000Z",
    };

    (chatService.getEventById as jest.Mock).mockResolvedValueOnce({
      id: 1,
      created_by: 2,
    });
    (chatService.canAccessEventChat as jest.Mock).mockResolvedValueOnce(true);
    (chatService.createMessage as jest.Mock).mockResolvedValueOnce(created);

    await postMessage(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
    );

    expect(chatService.createMessage).toHaveBeenCalledWith(
      1,
      3,
      "Bonjour la team",
    );
    expect(socketServer.emitNewMessage).toHaveBeenCalledWith(1, created);
    expect(responseStatus).toHaveBeenCalledWith(201);
  });

  it("empêche de supprimer le message d’un autre utilisateur", async () => {
    mockRequest.params = { messageId: "15" };

    (chatService.getMessageById as jest.Mock).mockResolvedValueOnce({
      id: 15,
      event_id: 1,
      user_id: 99,
      is_deleted: 0,
    });

    await deleteOwnMessage(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
    );

    expect(responseStatus).toHaveBeenCalledWith(403);
  });

  it("modère un message avec succès", async () => {
    mockRequest.params = { messageId: "21" };
    mockRequest.user = {
      userId: 1,
      email: "admin@test.fr",
      role: "ADMIN",
    };

    (chatService.getMessageById as jest.Mock).mockResolvedValueOnce({
      id: 21,
      event_id: 1,
      user_id: 4,
      is_deleted: 0,
    });
    (chatService.canModerateEventChat as jest.Mock).mockResolvedValueOnce(true);

    await moderateChatMessage(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
    );

    expect(chatService.moderateMessage).toHaveBeenCalledWith(21, 1);
    expect(socketServer.emitMessageDeleted).toHaveBeenCalledWith(1, 21);
    expect(responseJson).toHaveBeenCalledWith({ success: true });
  });
});
