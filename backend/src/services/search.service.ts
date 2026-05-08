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

interface SearchContext {
  userId: number;
  userRole: 'ADMIN' | 'PARTICIPANT';
}

export class SearchService {
  /**
   * Effectue une recherche globale sur plusieurs entités
   * @param query => Le texte à rechercher
   * @param userId => ID de l'utilisateur qui effectue la recherche
   * @param userRole => Rôle de l'utilisateur
   * @param limit => Nombre de résultats à retourner par type (défaut: 5)
   * @param offset => Décalage pour la pagination (défaut: 0)
   * @returns Les résultats consolidés
   */
  static async globalSearch(
    query: string,
    userId: number,
    userRole: 'ADMIN' | 'PARTICIPANT',
    limit: number = 5,
    offset: number = 0
  ): Promise<GlobalSearchResults> {
    if (!query || query.trim().length === 0) {
      throw new Error('Query cannot be empty');
    }

    const cleanQuery = query.trim();
    const escapedQuery = cleanQuery.replace(/[+\-><()~*"@]/g, '\\$&');
    const searchQuery = `+${escapedQuery.split(/\s+/).join(' +')}`;

    const context: SearchContext = { userId, userRole };
    const results: SearchResult[] = [];

    const [eventResults, userResults, zoneResults, messageResults] = 
      await Promise.all([
        this.searchEvents(searchQuery, limit, offset, context),
        this.searchUsers(searchQuery, limit, offset, context),
        this.searchZones(searchQuery, limit, offset, context),
        this.searchMessages(searchQuery, limit, offset, context),
      ]);

    results.push(...eventResults);
    results.push(...userResults);
    results.push(...zoneResults);
    results.push(...messageResults);

    results.sort((a, b) => b.relevance - a.relevance);

    return {
      query: cleanQuery,
      totalResults: results.length,
      results: results.slice(0, limit * 5),
      summary: {
        events: eventResults.length,
        users: userResults.length,
        zones: zoneResults.length,
        messages: messageResults.length,
      },
    };
  }

  /**
   * Recherche dans les événements avec vérification des permissions
   */
  private static async searchEvents(
    searchQuery: string,
    limit: number,
    offset: number,
    context: SearchContext
  ): Promise<SearchResult[]> {
    const statusFilter = context.userRole === 'ADMIN' 
      ? "AND e.status != 'CANCELLED'"
      : "AND e.status = 'PUBLISHED'";

    const query = `
      SELECT 
        e.id,
        e.name,
        e.description,
        e.location,
        e.status,
        e.start_date,
        e.end_date,
        MATCH(e.name, e.description, e.location) AGAINST(? IN BOOLEAN MODE) AS relevance
      FROM events e
      WHERE MATCH(e.name, e.description, e.location) AGAINST(? IN BOOLEAN MODE)
      ${statusFilter}
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
          endDate: row.end_date,
          description: row.description,
        },
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Recherche dans les utilisateurs avec masquage des infos privées
   */
  private static async searchUsers(
    searchQuery: string,
    limit: number,
    offset: number,
    context: SearchContext
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
        description: context.userRole === 'ADMIN' ? row.email : row.role,
        relevance: row.relevance,
        metadata: {
          email: context.userRole === 'ADMIN' ? row.email : undefined,
          role: row.role,
          avatarUrl: row.avatar_url,
        },
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Recherche dans les zones avec vérification des permissions sur l'événement parent
   */
  private static async searchZones(
    searchQuery: string,
    limit: number,
    offset: number,
    context: SearchContext
  ): Promise<SearchResult[]> {
    const statusFilter = context.userRole === 'ADMIN' 
      ? "AND e.status != 'CANCELLED'"
      : "AND e.status = 'PUBLISHED'";

    const query = `
      SELECT 
        z.id,
        z.name,
        z.description,
        z.capacity,
        z.event_id,
        e.name as event_name,
        e.start_date,
        e.end_date,
        MATCH(z.name, z.description) AGAINST(? IN BOOLEAN MODE) AS relevance
      FROM zones z
      JOIN events e ON z.event_id = e.id
      WHERE MATCH(z.name, z.description) AGAINST(? IN BOOLEAN MODE)
      ${statusFilter}
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
          startDate: row.start_date,
          endDate: row.end_date,
          capacity: row.capacity,
          description: row.description,
        },
      }));
    } finally {
      connection.release();
    }
  }

  /**
   * Recherche dans les messages avec vérification des permissions
   */
  private static async searchMessages(
    searchQuery: string,
    limit: number,
    offset: number,
    context: SearchContext
  ): Promise<SearchResult[]> {
    let query: string;
    let params: any[];

    if (context.userRole === 'ADMIN') {
      query = `
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
        AND e.status IN ('PUBLISHED', 'ONGOING', 'COMPLETED')
        ORDER BY relevance DESC
        LIMIT ? OFFSET ?
      `;
      params = [searchQuery, searchQuery, limit, offset];
    } else {
      query = `
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
        JOIN participations p ON e.id = p.event_id AND p.user_id = ?
        WHERE MATCH(m.content) AGAINST(? IN BOOLEAN MODE)
        AND m.is_deleted = FALSE
        AND p.status = 'APPROVED'
        ORDER BY relevance DESC
        LIMIT ? OFFSET ?
      `;
      params = [searchQuery, context.userId, searchQuery, limit, offset];
    }

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>(query, params);

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
    userId: number,
    userRole: 'ADMIN' | 'PARTICIPANT',
    filters?: {
      type?: 'event' | 'user' | 'zone' | 'message' | 'participation';
      eventId?: number;
      status?: string;
      participationStatus?: 'PENDING' | 'APPROVED' | 'REFUSED';
      dateFrom?: string;
      dateTo?: string;
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

    const context: SearchContext = { userId, userRole };
    let results: SearchResult[] = [];

    if (!filters?.type || filters.type === 'event') {
      const eventResults = await this.searchEvents(searchQuery, limit, offset, context);
      if (filters?.status) {
        results.push(...eventResults.filter((r) => r.metadata?.status === filters.status));
      } else {
        results.push(...eventResults);
      }
      if (filters?.dateFrom) {
        results = results.filter((r) => {
          const startDate = new Date(r.metadata?.startDate);
          return startDate >= new Date(filters.dateFrom!);
        });
      }
      if (filters?.dateTo) {
        results = results.filter((r) => {
          const endDate = new Date(r.metadata?.endDate);
          return endDate <= new Date(filters.dateTo!);
        });
      }
    }

    if (!filters?.type || filters.type === 'user') {
      const userResults = await this.searchUsers(searchQuery, limit, offset, context);
      results.push(...userResults);
    }

    if (!filters?.type || filters.type === 'zone') {
      let zoneResults = await this.searchZones(searchQuery, limit, offset, context);
      if (filters?.eventId) {
        zoneResults = zoneResults.filter((r) => r.metadata?.eventId === filters.eventId);
      }
      results.push(...zoneResults);
    }

    if (!filters?.type || filters.type === 'message') {
      let messageResults = await this.searchMessages(searchQuery, limit, offset, context);
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
    type: 'event' | 'user' | 'zone' | 'message' | 'participation',
    userId: number,
    userRole: 'ADMIN' | 'PARTICIPANT',
    limit: number = 10
  ): Promise<SearchResult[]> {
    const cleanQuery = query.trim();
    const escapedQuery = cleanQuery.replace(/[+\-><()~*"@]/g, '\\$&');
    const searchQuery = `+${escapedQuery.split(/\s+/).join(' +')}`;

    const context: SearchContext = { userId, userRole };

    switch (type) {
      case 'event':
        return this.searchEvents(searchQuery, limit, 0, context);
      case 'user':
        return this.searchUsers(searchQuery, limit, 0, context);
      case 'zone':
        return this.searchZones(searchQuery, limit, 0, context);
      case 'message':
        return this.searchMessages(searchQuery, limit, 0, context);
      default:
        throw new Error('Invalid search type');
    }
  }
}
