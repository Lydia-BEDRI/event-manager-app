import { api } from './api';

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

export interface AdvancedSearchParams {
  query: string;
  filters?: {
    type?: 'event' | 'user' | 'zone' | 'message';
    eventId?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  limit?: number;
  offset?: number;
}

export interface SearchByTypeResponse {
  type: 'event' | 'user' | 'zone' | 'message';
  query: string;
  totalResults: number;
  results: SearchResult[];
}

export const searchService = {
  async globalSearch(
    query: string,
    limit: number = 5,
    offset: number = 0,
    token?: string
  ): Promise<GlobalSearchResults> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    const response = await api.get<{ success: boolean; data: GlobalSearchResults }>(`/search?${params}`, token);
    return response.data;
  },
  async advancedSearch(
    params: AdvancedSearchParams,
    token?: string
  ): Promise<{
    query: string;
    totalResults: number;
    results: SearchResult[];
    filters?: any;
  }> {
    const response = await api.post<{ success: boolean; data: any }>('/search/advanced', params, token);
    return response.data;
  },

  async searchByType(
    type: 'event' | 'user' | 'zone' | 'message',
    query: string,
    limit: number = 10,
    token?: string
  ): Promise<SearchByTypeResponse> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    const response = await api.get<{ success: boolean; data: SearchByTypeResponse }>(`/search/by-type/${type}?${params}`, token);
    return response.data;
  },

  async suggestEvents(query: string, limit: number = 5, token?: string): Promise<SearchResult[]> {
    const response = await this.searchByType('event', query, limit, token);
    return response.results;
  },

  async suggestUsers(query: string, limit: number = 5, token?: string): Promise<SearchResult[]> {
    const response = await this.searchByType('user', query, limit, token);
    return response.results;
  },

  async suggestZones(query: string, limit: number = 5, token?: string): Promise<SearchResult[]> {
    const response = await this.searchByType('zone', query, limit, token);
    return response.results;
  },

  async suggestMessages(query: string, limit: number = 5, token?: string): Promise<SearchResult[]> {
    const response = await this.searchByType('message', query, limit, token);
    return response.results;
  },

  async globalSearchWithDebounce(
    query: string,
    limit: number = 5,
    offset: number = 0,
    token?: string
  ): Promise<GlobalSearchResults> {
    return this.globalSearch(query, limit, offset, token);
  },
};
