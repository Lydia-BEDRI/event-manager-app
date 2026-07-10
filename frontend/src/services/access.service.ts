import { apiFetch, ApiError } from './api';
import { AccessParticipant, AccessVerifyResponse } from '../types/access.types';

function getToken(): string {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return token;
}

async function toJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function verifyAccessToken(payload: {
  token: string;
  zoneId: number;
}): Promise<AccessVerifyResponse> {
  getToken();
  const response = await apiFetch('/access/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await toJson(response);

  if (data && typeof data.authorized === 'boolean') {
    return { ...data, statusCode: response.status } as AccessVerifyResponse;
  }

  if (!response.ok) {
    throw new ApiError(data?.message || data?.error || response.statusText || 'Erreur API', response.status);
  }

  return data as AccessVerifyResponse;
}

export async function listApprovedParticipants(eventId: number): Promise<AccessParticipant[]> {
  getToken();
  const response = await apiFetch(`/access/events/${eventId}/participants`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await toJson(response);

  if (!response.ok) {
    throw new ApiError(data?.message || data?.error || response.statusText || 'Erreur API', response.status);
  }

  return data.participants || [];
}

export async function generateBadgeToken(payload: {
  eventId: number;
  participationId: number;
}): Promise<string> {
  getToken();
  const response = await apiFetch('/access/badge-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await toJson(response);

  if (!response.ok) {
    throw new ApiError(data?.message || data?.error || response.statusText || 'Erreur API', response.status);
  }

  return data.token;
}
