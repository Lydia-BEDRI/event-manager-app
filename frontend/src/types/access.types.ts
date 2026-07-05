export interface AccessParticipant {
  participationId: number;
  userId: number;
  qrCode: string | null;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export interface AccessVerifyResponse {
  statusCode?: number;
  authorized: boolean;
  reason?: string;
  id?: number;
  is_valid: boolean;
  participant?: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  participant_name?: string;
  event?: {
    id: number;
    name: string;
  };
  event_name?: string;
  zone?: {
    id: number;
    name: string;
  };
  zone_name?: string;
  scanned_at: string;
}
