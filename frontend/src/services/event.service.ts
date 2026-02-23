import { api } from './api';
import { Event } from '../types/event.types';

export const getAllEvents = async () => {
  const token = localStorage.getItem('accessToken') || undefined;
  return await api.get<Event[]>('/events', token);
};

export const getEventById = async (id: number) => {
  const token = localStorage.getItem('accessToken') || undefined;
  return await api.get<Event>(`/events/${id}`, token);
};
