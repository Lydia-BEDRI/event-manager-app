export interface SearchResult {
  type: 'event' | 'user' | 'zone' | 'message';
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
  };
}

export interface SearchFilter {
  type?: 'event' | 'user' | 'zone' | 'message';
  eventId?: number;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
