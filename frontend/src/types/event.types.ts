export interface Event {
  id: number;
  name: string;
  description?: string;
  location: string;
  start_date: string;
  end_date: string;
  capacity: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at?: string;
}

export type EventStatus = Event['status'];

export interface Zone {
  id: number;
  event_id: number;
  name: string;
  description?: string;
  capacity: number;
  created_at?: string;
}

export interface Participant {
  id: number;
  user_id: number;
  event_id: number;
  status: 'PENDING' | 'APPROVED' | 'REFUSED';
  qr_code?: string;
  created_at?: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export type ParticipantStatus = Participant['status'];

export interface CreateEventDto {
  name: string;
  description?: string;
  location: string;
  start_date: string;
  end_date: string;
  capacity: number;
  status?: EventStatus;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

export interface CreateZoneDto {
  name: string;
  description?: string;
  capacity: number;
}

export interface UpdateZoneDto extends Partial<CreateZoneDto> {}
