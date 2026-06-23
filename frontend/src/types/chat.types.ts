export interface ChatEventSummary {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface ChatMessage {
  id: number;
  eventId: number;
  userId: number;
  authorName: string;
  authorRole: string;
  content: string;
  isDeleted: boolean;
  isModerated: boolean;
  moderatedBy: number | null;
  moderatedByName: string | null;
  moderatedAt: string | null;
  createdAt: string;
}

export interface ChatMember {
  id: number;
  name: string;
  role: string;
}
