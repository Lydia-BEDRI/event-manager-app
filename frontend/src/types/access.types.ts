export interface AccessVerifyResponse {
  authorized: boolean;
  reason?: string;
  participant?: {
    id: number;
    fullName: string;
    email: string;
  };
  event?: {
    id: number;
    name: string;
  };
  zoneId?: number;
  scannedAt?: string;
}

export interface AccessParticipant {
  participationId: number;
  userId: number;
  qrCode: string | null;
  firstName: string;
  lastName: string;
  email: string;
}
