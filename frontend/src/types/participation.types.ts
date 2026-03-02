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
