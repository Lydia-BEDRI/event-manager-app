import { api } from './api';
import { Zone, CreateZoneDto } from '../types/zone.types';

export const getAllZones = async () => {
  const token = localStorage.getItem('accessToken') || '';
  return await api.get<Zone[]>('/zones', token);
};

export const getDistinctZones = async () => {
  const token = localStorage.getItem('accessToken') || '';
  return await api.get<Omit<Zone, 'id' | 'event_id' | 'event_name' | 'created_at'>[]>('/zones/distinct', token);
};

export const getEventZones = async (eventId: number) => {
  const token = localStorage.getItem('accessToken') || '';
  return await api.get<Zone[]>(`/zones/${eventId}/zones`, token);
};

export const createZone = async (eventId: number, data: CreateZoneDto) => {
  const token = localStorage.getItem('accessToken') || '';
  return await api.post<Zone>(`/zones/${eventId}/zones`, data, token);
};