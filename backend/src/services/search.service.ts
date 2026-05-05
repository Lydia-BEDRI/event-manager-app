import { RowDataPacket } from 'mysql2/promise';
import pool from '../config/database';

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

export class SearchService {
  /**
   * Effectue une recherche globale sur plusieurs entités
   * @param query => Le texte à rechercher
   * @param limit => Nombre de résultats à retourner par type (défaut: 5)
   * @param offset => Décalage pour la pagination (défaut: 0)
   * @returns Les résultats consolidés
   */
  static async globalSearch(
    query: string,
    limit: number = 5,
    offset: number = 0
  ): Promise<GlobalSearchResults> {
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    const cleanQuery = query.trim();
    const escapedQuery = cleanQuery.replace(/[+\-><()~*"@]/g, '\\$&');
    const searchQuery = `+${escapedQuery.split(/\s+/).join(' +')}`;

    const results: SearchResult[] = [];

    const [eventResults, userResults, zoneResults, messageResults] = 
      await Promise.all([
        this.searchEvents(searchQuery, limit, offset),
        this.searchUsers(searchQuery, limit, offset),
        this.searchZones(searchQuery, limit, offset),
        this.searchMessages(searchQuery, limit, offset),
      ]);

    results.push(...eventResults);
    results.push(...userResults);
    results.push(...zoneResults);
    results.push(...messageResults);

    results.sort((a, b) => b.relevance - a.relevance);

    return {
      query: cleanQuery,
      totalResults: results.length,
      results: results.slice(0, limit * 4), // Limiter le total
      summary: {
        events: eventResults.length,
        users: userResults.length,
        zones: zoneResults.length,
        messages: messageResults.length,
      },
    };
  }

  /**
   * Recherche dans les événements
   */
  private static async searchEvents(
    searchQuery: string,
    limit: number,
    offset: number
  ): Promise<SearchResult[]> {
    const query = `
      SELECT 
        e.id,
        e.name,
        e.description,
        e.location,
        e.status,
        e.start_date,
        MATCH(e.name, e.description, e.location) AGAINST(? IN BOOLEAN MODE) AS relevance
      FROM events e
      WHERE MATCH(e.name, e.description, e.location) AGAINST(? IN BOOLEAN MODE)
      AND e.status != 'CANCELLED'
      ORDER BY relevance DESC
      LIMIT ? OFFSET ?
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>(query, [
        searchQuery,
        searchQuery,
        limit,
        offset,
      ]);

      return rows.map((row) => ({
        type: 'event' as const,
        id: row.id,
        title: row.name,
        description: row.location,
        relevance: row.relevance,
        metadata: {
          status: row.status,
          startDate: row.start_date,
          description: row.description,
        },
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Recherche dans les utilisateurs
   */
  private static async searchUsers(
    searchQuery: string,
    limit: number,
    offset: number
  ): Promise<SearchResult[]> {
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.avatar_url,
        MATCH(u.first_name, u.last_name, u.email) AGAINST(? IN BOOLEAN MODE) AS relevance
      FROM users u
      WHERE MATCH(u.first_name, u.last_name, u.email) AGAINST(? IN BOOLEAN MODE)
      AND u.is_active = TRUE
      ORDER BY relevance DESC
      LIMIT ? OFFSET ?
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>(query, [
        searchQuery,
        searchQuery,
        limit,
        offset,
      ]);

      return rows.map((row) => ({
        type: 'user' as const,
        id: row.id,
        title: `${row.first_name} ${row.last_name}`,
        description: row.email,
        relevance: row.relevance,
        metadata: {
          email: row.email,
          role: row.role,
          avatarUrl: row.avatar_url,
        },
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Recherche dans les zones
   */
  private static async searchZones(
    searchQuery: string,
    limit: number,
    offset: number
  ): Promise<SearchResult[]> {
    const query = `
      SELECT 
        z.id,
        z.name,
        z.description,
        z.capacity,
        z.event_id,
        e.name as event_name,
        MATCH(z.name, z.description) AGAINST(? IN BOOLEAN MODE) AS relevance
      FROM zones z
      JOIN events e ON z.event_id = e.id
      WHERE MATCH(z.name, z.description) AGAINST(? IN BOOLEAN MODE)
      AND e.status != 'CANCELLED'
      ORDER BY relevance DESC
      LIMIT ? OFFSET ?
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>(query, [
        searchQuery,
        searchQuery,
        limit,
        offset,
      ]);

      return rows.map((row) => ({
        type: 'zone' as const,
        id: row.id,
        title: row.name,
        description: `Event: ${row.event_name}`,
        relevance: row.relevance,
        metadata: {
          eventId: row.event_id,
          eventName: row.event_name,
          capacity: row.capacity,
          description: row.description,
        },
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Recherche dans les messages
   */
  private static async searchMessages(
    searchQuery: string,
    limit: number,
    offset: number
  ): Promise<SearchResult[]> {
    const query = `
      SELECT 
        m.id,
        m.content,
        m.event_id,
        m.user_id,
        m.created_at,
        u.first_name,
        u.last_name,
        e.name as event_name,
        MATCH(m.content) AGAINST(? IN BOOLEAN MODE) AS relevance
      FROM messages m
      JOIN events e ON m.event_id = e.id
      JOIN users u ON m.user_id = u.id
      WHERE MATCH(m.content) AGAINST(? IN BOOLEAN MODE)
      AND m.is_deleted = FALSE
      AND e.status != 'CANCELLED'
      ORDER BY relevance DESC
      LIMIT ? OFFSET ?
    `;

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>(query, [
        searchQuery,
        searchQuery,
        limit,
        offset,
      ]);

      return rows.map((row) => ({
        type: 'message' as const,
        id: row.id,
        title: `${row.first_name} ${row.last_name} in ${row.event_name}`,
        description: row.content.substring(0, 100),
        relevance: row.relevance,
        metadata: {
          eventId: row.event_id,
          userId: row.user_id,
          author: `${row.first_name} ${row.last_name}`,
          content: row.content,
          createdAt: row.created_at,
        },
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Recherche avancée avec filtres
   */
  static async advancedSearch(
    query: string,
    filters?: {
      type?: 'event' | 'user' | 'zone' | 'message';
      eventId?: number;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    limit: number = 10,
    offset: number = 0
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    const cleanQuery = query.trim();
    const escapedQuery = cleanQuery.replace(/[+\-><()~*"@]/g, '\\$&');
    const searchQuery = `+${escapedQuery.split(/\s+/).join(' +')}`;

    let results: SearchResult[] = [];

    if (!filters?.type || filters.type === 'event') {
      const eventResults = await this.searchEvents(searchQuery, limit, offset);
      if (filters?.status) {
        results.push(...eventResults.filter((r) => r.metadata?.status === filters.status));
      } else {
        results.push(...eventResults);
      }
    }

    if (!filters?.type || filters.type === 'user') {
      const userResults = await this.searchUsers(searchQuery, limit, offset);
      results.push(...userResults);
    }

    if (!filters?.type || filters.type === 'zone') {
      let zoneResults = await this.searchZones(searchQuery, limit, offset);
      if (filters?.eventId) {
        zoneResults = zoneResults.filter((r) => r.metadata?.eventId === filters.eventId);
      }
      results.push(...zoneResults);
    }

    if (!filters?.type || filters.type === 'message') {
      let messageResults = await this.searchMessages(searchQuery, limit, offset);
      if (filters?.eventId) {
        messageResults = messageResults.filter((r) => r.metadata?.eventId === filters.eventId);
      }
      results.push(...messageResults);
    }

    results.sort((a, b) => b.relevance - a.relevance);
    return results.slice(0, limit);
  }

  /**
   * Recherche par type spécifique (pour autocomplete, suggestions)
   */
  static async searchByType(
    query: string,
    type: 'event' | 'user' | 'zone' | 'message',
    limit: number = 10
  ): Promise<SearchResult[]> {
    const cleanQuery = query.trim();
    const escapedQuery = cleanQuery.replace(/[+\-><()~*"@]/g, '\\$&');
    const searchQuery = `+${escapedQuery.split(/\s+/).join(' +')}`;

    switch (type) {
      case 'event':
        return this.searchEvents(searchQuery, limit, 0);
      case 'user':
        return this.searchUsers(searchQuery, limit, 0);
      case 'zone':
        return this.searchZones(searchQuery, limit, 0);
      case 'message':
        return this.searchMessages(searchQuery, limit, 0);
      default:
        throw new Error('Invalid search type');
    }
  }
}
