import { api } from './api';
import { CreateEventDto, Event } from '../types/event.types';

export const getAllEvents = async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.get<Event[]>('/events', token);
};

export const getEventById = async (id: number) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.get<Event>(`/events/${id}`, token);
};

export const createEvent = async (data: CreateEventDto) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.post<Event>('/events', data, token);
};

export const updateEvent = async (id: number, data: Partial<CreateEventDto>) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  return await api.put<Event>(`/events/${id}`, data, token);
};

export const deleteEvent = async (id: number) => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }
  const result = await api.delete<Event>(`/events/${id}`, token);
  return result;
};