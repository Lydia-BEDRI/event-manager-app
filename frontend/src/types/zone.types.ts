export interface Zone {
  id: number;
  event_id: number;
  name: string;
  description?: string;
  capacity: number;
  created_at: string;
  event_name?: string; // Ajouté par le JOIN côté backend
}

export interface CreateZoneDto {
  name: string;
  description?: string;
  capacity: number;
}

export interface UpdateZoneDto {
  name?: string;
  description?: string;
  capacity?: number;
}