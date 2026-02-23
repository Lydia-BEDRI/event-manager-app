import { api } from './api';
import { Zone } from '../types/zone.types';

export const getAllZones = async () => {
  const token = localStorage.getItem('accessToken') || '';
  return await api.get<Zone[]>('/zones', token);
};

export const getEventZones = async (eventId: number) => {
  const token = localStorage.getItem('accessToken') || '';
  return await api.get<Zone[]>(`/zones/event/${eventId}`, token);
};