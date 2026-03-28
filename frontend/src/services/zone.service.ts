import { api } from './api';
import { Zone, CreateZoneDto, UpdateZoneDto } from '../types/zone.types';

export const getAllZones = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.get<Zone[]>('/zones', token);
};

export const getDistinctZones = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.get<ZoneInput[]>('/zones/distinct', token);
};

export const getEventZones = async (eventId: number) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.get<Zone[]>(`/zones/event/${eventId}`, token);
};

export const createZone = async (eventId: number, data: CreateZoneDto) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.post<Zone>(`/zones/${eventId}`, data, token);
};

export const deleteZone = async (eventId: number, zoneId: number) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.delete(`/zones/${zoneId}`, token);
};

export const updateZone = async (eventId: number, zoneId: number, data: UpdateZoneDto) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.put<Zone>(`/zones/${zoneId}`, data, token);
};

export const getZoneById = async (zoneId: number) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  const zones = await api.get<Zone[]>('/zones', token);
  return zones.find(zone => zone.id === zoneId);
};

interface ZoneInput {
  name: string;
  description?: string;
  capacity: number;
}