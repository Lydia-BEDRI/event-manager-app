import { api } from './api';
import { Participation, ParticipantDashboardStats } from '../types/participation.types';

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

export const getMyParticipantStats = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.get<ParticipantDashboardStats>('/participations/my-stats', token);
};
export const getMyParticipations = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.get<Participation[]>('/participations/my-participations', token);
};