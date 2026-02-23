export interface Zone {
  id: number;
  event_id: number;
  name: string;
  description?: string;
  capacity: number;
  created_at?: string;
}