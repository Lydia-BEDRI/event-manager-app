import express from "express";
import request from "supertest";
import chatRoutes from "../routes/chat.routes";
import * as chatService from "../services/chat.service";

jest.mock("../services/chat.service");
jest.mock("../middlewares/authenticate", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      userId: req.headers["x-user-id"] ? Number(req.headers["x-user-id"]) : 3,
      email: "user@test.fr",
      role: req.headers["x-role"] || "PARTICIPANT",
    };
    next();
  },
}));
jest.mock("../sockets/server.socket", () => ({
  emitNewMessage: jest.fn(),
  emitMessageDeleted: jest.fn(),
  emitMessageUpdated: jest.fn(),
}));

describe("Chat Routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/chat", chatRoutes);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/chat/events retourne les chats accessibles", async () => {
    (chatService.listAccessibleChatEvents as jest.Mock).mockResolvedValueOnce([
      {
        id: 1,
        name: "Conférence",
        location: "Paris",
        startDate: "2026-04-15T09:00:00.000Z",
        endDate: "2026-04-15T18:00:00.000Z",
        status: "PUBLISHED",
      },
    ]);

    const response = await request(app).get("/api/chat/events");

    expect(response.status).toBe(200);
    expect(response.body.events).toHaveLength(1);
  });

  it("POST /api/chat/events/:eventId/messages crée un message", async () => {
    (chatService.getEventById as jest.Mock).mockResolvedValueOnce({
      id: 1,
      created_by: 1,
    });
    (chatService.canAccessEventChat as jest.Mock).mockResolvedValueOnce(true);
    (chatService.createMessage as jest.Mock).mockResolvedValueOnce({
      id: 9,
      eventId: 1,
      userId: 3,
      authorName: "Participant Test",
      content: "Hello",
      isDeleted: false,
      isModerated: false,
      moderatedBy: null,
      moderatedByName: null,
      moderatedAt: null,
      createdAt: "2026-03-29T09:00:00.000Z",
    });

    const response = await request(app)
      .post("/api/chat/events/1/messages")
      .send({ content: "Hello" });

    expect(response.status).toBe(201);
    expect(response.body.message.id).toBe(9);
  });
});
