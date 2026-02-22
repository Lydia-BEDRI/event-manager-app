import { api } from './api';

export interface DashboardStats {
  events: {
    total_events: number;
    published_events: number;
    ongoing_events: number;
    draft_events: number;
    completed_events: number;
    cancelled_events: number;
    events_this_month: number;
    average_fill_rate: number;
    avg_zones_per_event: number;
  };
  attendanceByEvent: AttendanceByEvent[];
  participants: {
    total_participants: number;
    total_admins: number;
    total_users: number;
    new_this_month: number;
    approval_rate: number;
    avg_participants_per_event: number;
  };
  approvalStats: {
    total_requests: number;
    approved_count: number;
    approval_rate: number;
  };
  participations: {
    total_participations: number;
    pending_participations: number;
    approved_participations: number;
    refused_participations: number;
  };
  access: {
    total_scans: number;
    scans_today: number;
    valid_scans: number;
    invalid_scans: number;
    avg_scans_per_event: number;
  };
  accessByZone: AccessByZone[];
  peakHours: PeakHour[];
  zones: {
    total_zones: number;
    total_capacity: number;
    avg_capacity: number;
  };
  topZones: TopZone[];
  zoneDistribution: ZoneDistribution[];
  messages: {
    total_messages: number;
    active_chat_users: number;
    messages_today: number;
    moderated_messages: number;
  };
  actionsByType: ActionsByType[];
  actionsByAdmin: ActionsByAdmin[];
  notifications: {
    total: number;
    read_count: number;
    unread_count: number;
    byType: NotificationByType[];
  };
  exports: {
    total_exports: number;
    completed_exports: number;
    pending_exports: number;
    processing_exports: number;
    failed_exports: number;
    recent: RecentExport[];
  };
  kpis: {
    global_participation_rate: number;
    avg_validation_hours: number;
    avg_zone_fill_rate: number;
    attendance_rate: number;
  };
  upcomingEvents: UpcomingEvent[];
  recentActivity: ActivityLog[];
  pendingRequests: PendingRequest[];
}

export interface AttendanceByEvent {
  id: number;
  name: string;
  status: string;
  total_approved: number;
  attended: number;
  attendance_rate: number;
}

export interface AccessByZone {
  id: number;
  name: string;
  event_name: string;
  capacity: number;
  total_scans: number;
  unique_visitors: number;
  occupancy_rate: number;
}

export interface PeakHour {
  hour: number;
  scan_count: number;
}

export interface TopZone {
  id: number;
  name: string;
  event_name: string;
  capacity: number;
  unique_visitors: number;
  total_visits: number;
}

export interface ZoneDistribution {
  zone_name: string;
  authorized_participants: number;
}

export interface ActionsByType {
  action: string;
  count: number;
}

export interface ActionsByAdmin {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  action_count: number;
}

export interface NotificationByType {
  type: string;
  count_by_type: number;
}

export interface RecentExport {
  id: number;
  type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  first_name: string;
  last_name: string;
  event_name: string | null;
}

export interface UpcomingEvent {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  capacity: number;
  location: string;
  status: string;
  participants_count: number;
  approved_count: number;
}

export interface ActivityLog {
  id: number;
  action: string;
  entity_type: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface PendingRequest {
  id: number;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  event_name: string;
  event_id: number;
}

export const adminService = {
  getDashboardStats: (token: string) =>
    api.get<DashboardStats>('/admin/dashboard-stats', token),
};
