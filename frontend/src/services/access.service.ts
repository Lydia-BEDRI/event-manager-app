import { api } from "./api";
import { AccessParticipant, AccessVerifyResponse } from "../types/access.types";

function getToken(): string {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Token manquant. Veuillez vous reconnecter.");
  }
  return token;
}

export async function verifyAccessToken(payload: {
  eventId: number;
  token: string;
  zoneId?: number;
}): Promise<AccessVerifyResponse> {
  return api.post<AccessVerifyResponse>("/access/verify", payload, getToken());
}

export async function listApprovedParticipants(
  eventId: number,
): Promise<AccessParticipant[]> {
  const response = await api.get<{ participants: AccessParticipant[] }>(
    `/access/events/${eventId}/participants`,
    getToken(),
  );

  return response.participants;
}

export async function generateBadgeToken(payload: {
  eventId: number;
  participationId: number;
}): Promise<string> {
  const response = await api.post<{ token: string }>(
    "/access/badge-token",
    payload,
    getToken(),
  );

  return response.token;
}
