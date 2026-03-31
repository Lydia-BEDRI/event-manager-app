/// <reference types="jest" />

import {
  deleteMyMessage,
  getChatEvents,
  getChatMessages,
  moderateMessage,
  sendChatMessage,
} from "../chat.service";
import { api } from "../api";

jest.mock("../api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("chat.service", () => {
  const token = "token-123";

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("accessToken", token);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("récupère les événements chat accessibles", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      events: [
        {
          id: 1,
          name: "Event",
          location: "Paris",
          startDate: "",
          endDate: "",
          status: "PUBLISHED",
        },
      ],
    });

    const result = await getChatEvents();

    expect(api.get).toHaveBeenCalledWith("/chat/events", token);
    expect(result).toHaveLength(1);
  });

  it("récupère les messages d’un événement", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ messages: [{ id: 1 }] });

    const result = await getChatMessages(1);

    expect(api.get).toHaveBeenCalledWith("/chat/events/1/messages", token);
    expect(result).toHaveLength(1);
  });

  it("envoie un message", async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      message: { id: 99, content: "Salut" },
    });

    const result = await sendChatMessage(1, "Salut");

    expect(api.post).toHaveBeenCalledWith(
      "/chat/events/1/messages",
      { content: "Salut" },
      token,
    );
    expect(result.id).toBe(99);
  });

  it("supprime son message", async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({ success: true });

    await deleteMyMessage(10);

    expect(api.delete).toHaveBeenCalledWith("/chat/messages/10", token);
  });

  it("modère un message", async () => {
    (api.patch as jest.Mock).mockResolvedValueOnce({ success: true });

    await moderateMessage(10);

    expect(api.patch).toHaveBeenCalledWith(
      "/chat/messages/10/moderate",
      {},
      token,
    );
  });
});
