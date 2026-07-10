import { api } from './api';
import {
  GeneratedQrCode,
  MyParticipation,
  ParticipantDashboardStats,
  ParticipantQrCode,
  Participation,
  PresenceVerificationResult,
} from '../types/participation.types';
import { verifyAccessToken } from './access.service';

export const getAllParticipations = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.get<Participation[]>('/participations', token);
};

export const getParticipationsByEvent = async (eventId: number) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.get<Participation[]>(`/participations/event/${eventId}`, token);
};

export const updateParticipationStatus = async (
  participationId: number,
  status: 'APPROVED' | 'REFUSED'
) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.patch<Participation>(`/participations/${participationId}/status`, { status }, token);
};

export const getMyParticipantStats = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.get<ParticipantDashboardStats>('/participations/my-stats', token);
};

export const requestEventParticipation = async (eventId: number) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.post<MyParticipation>(`/participations/events/${eventId}/request`, {}, token);
};

export const getMyQrCodes = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.get<ParticipantQrCode[]>('/participations/my-qr-codes', token);
};

export const generateParticipationQrCode = async (participationId: number) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.post<GeneratedQrCode>(`/participations/${participationId}/qr-code`, {}, token);
};

export const verifyAccessScan = async (qrCode: string, zoneId: number) => {
  return await verifyAccessToken({ token: qrCode, zoneId }) as PresenceVerificationResult;
};
