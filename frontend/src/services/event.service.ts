import { api } from './api';
import { CreateEventDto, Event } from '../types/event.types';

export const getAllEvents = async () => {
  const token = localStorage.getItem('accessToken') || undefined;
  return await api.get<Event[]>('/events', token);
};

export const getEventById = async (id: number) => {
  const token = localStorage.getItem('accessToken') || undefined;
  return await api.get<Event>(`/events/${id}`, token);
};
export const createEvent = async (data: CreateEventDto) => {
  const token = localStorage.getItem('accessToken') || '';
  return await api.post<Event>('/events', data, token);
};
export const deleteEvent = async (id: number) => {
  const token = localStorage.getItem('accessToken') || '';
  const result = await api.delete<Event>(`/events/${id}`, token);
  return result;
};