import { api } from './api';
import { Zone } from '../types/zone.types';

export const getAllZones = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await api(`/zones`, {
    headers: { 
      Authorization: `Bearer ${token}` 
    }
  });
  return response as Zone[];
};

export const getEventZones = async (eventId: number) => {
  const token = localStorage.getItem('accessToken');
  const response = await api(`/zones/event/${eventId}`, {
    headers: { 
      Authorization: `Bearer ${token}` 
    }
  });
  return response as Zone[];
};

export const createZone = async (eventId: number, data: { name: string; description?: string; capacity: number }) => {
  const token = localStorage.getItem('accessToken');
  const response = await api(`/zones/event/${eventId}`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response as Zone;
};

export const updateZone = async (eventId: number, zoneId: number, data: Partial<Zone>) => {
  const token = localStorage.getItem('accessToken');
  const response = await api(`/zones/event/${eventId}/${zoneId}`, {
    method: 'PUT',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response as Zone;
};

export const deleteZone = async (eventId: number, zoneId: number) => {
  const token = localStorage.getItem('accessToken');
  await api(`/zones/event/${eventId}/${zoneId}`, {
    method: 'DELETE',
    headers: { 
      Authorization: `Bearer ${token}` 
    }
  });
};