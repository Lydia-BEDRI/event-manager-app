import { api } from "./api";
import { ChatEventSummary, ChatMember, ChatMessage } from "../types/chat.types";

function getToken(): string {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Token manquant. Veuillez vous reconnecter.");
  }
  return token;
}

export async function getChatEvents(): Promise<ChatEventSummary[]> {
  const token = getToken();
  const response = await api.get<{ events: ChatEventSummary[] }>(
    "/chat/events",
    token,
  );
  return response.events;
}

export async function getChatMessages(eventId: number): Promise<ChatMessage[]> {
  const token = getToken();
  const response = await api.get<{ messages: ChatMessage[] }>(
    `/chat/events/${eventId}/messages`,
    token,
  );
  return response.messages;
}

export async function getChatMembers(eventId: number): Promise<ChatMember[]> {
  const token = getToken();
  const response = await api.get<{ members: ChatMember[] }>(
    `/chat/events/${eventId}/members`,
    token,
  );
  return response.members;
}

export async function sendChatMessage(
  eventId: number,
  content: string,
): Promise<ChatMessage> {
  const token = getToken();
  const response = await api.post<{ message: ChatMessage }>(
    `/chat/events/${eventId}/messages`,
    { content },
    token,
  );
  return response.message;
}

export async function deleteMyMessage(messageId: number): Promise<void> {
  const token = getToken();
  await api.delete<{ success: boolean }>(`/chat/messages/${messageId}`, token);
}

export async function moderateMessage(messageId: number): Promise<void> {
  const token = getToken();
  await api.patch<{ success: boolean }>(
    `/chat/messages/${messageId}/moderate`,
    {},
    token,
  );
}
