import { api } from './api';
import { Participation } from '../types/participation.types';

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
