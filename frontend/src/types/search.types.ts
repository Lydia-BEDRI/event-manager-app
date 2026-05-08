export interface SearchResult {
  type: 'event' | 'user' | 'zone' | 'message' | 'participation';
  id: number;
  title: string;
  description?: string;
  relevance: number;
  metadata?: Record<string, any>;
}

export interface GlobalSearchResults {
  query: string;
  totalResults: number;
  results: SearchResult[];
  summary: {
    events: number;
    users: number;
    zones: number;
    messages: number;
    participations: number;
  };
}

export interface SearchFilter {
  type?: 'event' | 'user' | 'zone' | 'message' | 'participation';
  eventId?: number;
  status?: string;
  participationStatus?: 'PENDING' | 'APPROVED' | 'REFUSED';
  dateFrom?: Date;
  dateTo?: Date;
}
