export interface Participation {
  id: number;
  user_id: number;
  event_id: number;
  status: 'PENDING' | 'APPROVED' | 'REFUSED';
  qr_code: string | null;
  created_at: string;
  approved_at: string | null;
  email: string;
  first_name: string;
  last_name: string;
  event_name: string;
  event_location: string;
  event_start_date: string;
  approved_by_first_name: string | null;
  approved_by_last_name: string | null;
}

export interface ParticipationStats {
  total_participations: number;
  approved_participations: number;
  pending_participations: number;
  refused_participations: number;
}

export interface ZoneAccessStats {
  unique_zones_visited: number;
  total_zone_accesses: number;
}

export interface MyParticipation {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REFUSED';
  qr_code: string | null;
  created_at: string;
  approved_at: string | null;
  event_id: number;
  event_name: string;
  event_location: string;
  event_start_date: string;
  event_end_date: string;
  event_capacity: number;
  event_status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}

export interface AvailableEvent {
  id: number;
  name: string;
  description: string | null;
  location: string;
  start_date: string;
  end_date: string;
  capacity: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  current_participants: number;
}

export interface UpcomingEvent {
  id: number;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: 'PENDING' | 'APPROVED' | 'REFUSED';
  qr_code: string | null;
}

export interface PastEvent {
  id: number;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: 'PENDING' | 'APPROVED' | 'REFUSED';
  zones_visited: number;
}

export interface ParticipantDashboardStats {
  stats: ParticipationStats;
  zoneAccess: ZoneAccessStats;
  myParticipations: MyParticipation[];
  availableEvents: AvailableEvent[];
  upcomingEvents: UpcomingEvent[];
  pastEvents: PastEvent[];
}

export interface ParticipantQrCode {
  id: number;
  event_id: number;
  qr_code: string;
  qr_code_data: string | null;
  event_name: string;
  event_location: string;
  event_start_date: string;
  event_end_date: string;
}

export interface GeneratedQrCode {
  id: number;
  qr_code: string;
  qr_code_data: string;
}

export interface PresenceVerificationResult {
  id?: number;
  authorized?: boolean;
  reason?: string;
  is_valid: boolean;
  participant_name?: string;
  event_name?: string;
  zone_name?: string;
  participant?: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  event?: {
    id: number;
    name: string;
  };
  zone?: {
    id: number;
    name: string;
  };
  scanned_at: string;
}
