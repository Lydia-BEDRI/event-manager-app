import pool from "../config/database";
import { notifyChatMentions } from "../services/chat-mention.service";
import { createNotification } from "../services/notification.service";

jest.mock("../config/database", () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock("../services/notification.service", () => ({
  createNotification: jest.fn(),
}));

const message = {
  id: 10,
  eventId: 5,
  userId: 3,
  authorName: "Charlie Durand",
  authorRole: "PARTICIPANT",
  content: "",
  isDeleted: false,
  isModerated: false,
  moderatedBy: null,
  moderatedByName: null,
  moderatedAt: null,
  createdAt: new Date().toISOString(),
};

describe("chat-mention.service", () => {
  beforeEach(() => jest.clearAllMocks());

  it("ignore un message sans mention", async () => {
    await notifyChatMentions({ ...message, content: "Bonjour" }, jest.fn());
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("déduplique, valide et notifie les membres mentionnés", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([[{ id: 4 }]]);
    const notification = { id: 20, user_id: 4 };
    (createNotification as jest.Mock).mockResolvedValueOnce(notification);
    const onCreated = jest.fn();

    await notifyChatMentions({
      ...message,
      content: "@[Diana](user:4) puis @[Diana Leroy](user:4) et @[Moi](user:3)",
    }, onCreated);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [5, 4]);
    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 4,
      type: "CHAT_MENTION",
      referenceId: 5,
    }));
    expect(onCreated).toHaveBeenCalledWith(notification);
  });
});
