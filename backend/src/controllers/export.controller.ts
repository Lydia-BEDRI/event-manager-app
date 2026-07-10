import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const jsonToCSV = (data: any[], headers: string[]): string => {
  if (data.length === 0) return '';
  
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
};

export const exportEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        e.id as 'ID Événement',
        e.name as 'Titre',
        e.description as 'Description',
        e.start_date as 'Date Début',
        e.end_date as 'Date Fin',
        e.location as 'Lieu',
        e.capacity as 'Capacité',
        e.status as 'Statut',
        e.created_at as 'Créé le',
        COUNT(DISTINCT p.id) as 'Nombre Participants',
        COUNT(DISTINCT z.id) as 'Nombre Zones'
      FROM events e
      LEFT JOIN participations p ON e.id = p.event_id
      LEFT JOIN zones z ON e.id = z.event_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    if (startDate) {
      query += ' AND e.start_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND e.end_date <= ?';
      params.push(endDate);
    }
    
    query += ' GROUP BY e.id ORDER BY e.start_date DESC';
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    const headers = ['ID Événement', 'Titre', 'Description', 'Date Début', 'Date Fin', 'Lieu', 'Capacité', 'Statut', 'Créé le', 'Nombre Participants', 'Nombre Zones'];
    const csv = jsonToCSV(rows, headers);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=events_${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting events:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
};

export const exportParticipations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, eventId } = req.query;
    
    let query = `
      SELECT 
        p.id as 'ID Participation',
        u.email as 'Email Participant',
        CONCAT(u.first_name, ' ', u.last_name) as 'Nom Complet',
        e.name as 'Événement',
        p.status as 'Statut',
        p.created_at as 'Inscrit le',
        p.qr_code as 'QR Code',
        COUNT(DISTINCT a.id) as 'Nombre Accès'
      FROM participations p
      JOIN users u ON p.user_id = u.id
      JOIN events e ON p.event_id = e.id
      LEFT JOIN access_logs a ON p.id = a.participation_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    if (startDate) {
      query += ' AND p.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND p.created_at <= ?';
      params.push(endDate);
    }
    if (eventId) {
      query += ' AND p.event_id = ?';
      params.push(eventId);
    }
    
    query += ' GROUP BY p.id ORDER BY p.created_at DESC';
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    const headers = ['ID Participation', 'Email Participant', 'Nom Complet', 'Événement', 'Statut', 'Inscrit le', 'QR Code', 'Nombre Accès'];
    const csv = jsonToCSV(rows, headers);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=participations_${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting participations:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
};

export const exportAccessLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, eventId, zoneId } = req.query;
    
    let query = `
      SELECT 
        a.id as 'ID Accès',
        u.email as 'Email Participant',
        CONCAT(u.first_name, ' ', u.last_name) as 'Nom Complet',
        e.name as 'Événement',
        z.name as 'Zone',
        a.scanned_at as 'Heure Accès',
        a.is_valid as 'Valide',
        a.ip_address as 'Adresse IP'
      FROM access_logs a
      JOIN participations p ON a.participation_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN events e ON p.event_id = e.id
      JOIN zones z ON a.zone_id = z.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    if (startDate) {
      query += ' AND a.scanned_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND a.scanned_at <= ?';
      params.push(endDate);
    }
    if (eventId) {
      query += ' AND p.event_id = ?';
      params.push(eventId);
    }
    if (zoneId) {
      query += ' AND a.zone_id = ?';
      params.push(zoneId);
    }
    
    query += ' ORDER BY a.scanned_at DESC';
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    const headers = ['ID Accès', 'Email Participant', 'Nom Complet', 'Événement', 'Zone', 'Heure Accès', 'Valide', 'Adresse IP'];
    const csv = jsonToCSV(rows, headers);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=access_logs_${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting access logs:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
};

export const exportUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        u.id as 'ID Utilisateur',
        u.email as 'Email',
        CONCAT(u.first_name, ' ', u.last_name) as 'Nom Complet',
        u.role as 'Rôle',
        u.created_at as 'Créé le',
        u.is_active as 'Actif',
        COUNT(DISTINCT p.id) as 'Nombre Participations',
        COUNT(DISTINCT a.id) as 'Nombre Accès'
      FROM users u
      LEFT JOIN participations p ON u.id = p.user_id
      LEFT JOIN access_logs a ON p.id = a.participation_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }
    if (startDate) {
      query += ' AND u.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND u.created_at <= ?';
      params.push(endDate);
    }
    
    query += ' GROUP BY u.id ORDER BY u.created_at DESC';
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    const headers = ['ID Utilisateur', 'Email', 'Nom Complet', 'Rôle', 'Créé le', 'Actif', 'Nombre Participations', 'Nombre Accès'];
    const csv = jsonToCSV(rows, headers);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
};

export const exportZones = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.query;
    
    let query = `
      SELECT 
        z.id as 'ID Zone',
        z.name as 'Nom',
        z.description as 'Description',
        e.name as 'Événement',
        z.capacity as 'Capacité',
        COUNT(DISTINCT a.id) as 'Nombre Accès Total'
      FROM zones z
      JOIN events e ON z.event_id = e.id
      LEFT JOIN access_logs a ON z.id = a.zone_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    if (eventId) {
      query += ' AND z.event_id = ?';
      params.push(eventId);
    }
    
    query += ' GROUP BY z.id ORDER BY e.start_date DESC, z.name';
    
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    
    const headers = ['ID Zone', 'Nom', 'Description', 'Événement', 'Capacité', 'Nombre Accès Total'];
    const csv = jsonToCSV(rows, headers);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=zones_${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting zones:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
};

export const exportStatistics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [eventStats] = await pool.query<RowDataPacket[]>(`
      SELECT 
        'Événements Total' as 'Métrique',
        COUNT(*) as 'Valeur'
      FROM events
      UNION ALL
      SELECT 
        'Événements Actifs',
        COUNT(*)
      FROM events
      WHERE status = 'ACTIVE'
      UNION ALL
      SELECT 
        'Participants Total',
        COUNT(*)
      FROM users
      WHERE role = 'PARTICIPANT'
      UNION ALL
      SELECT 
        'Participations Total',
        COUNT(*)
      FROM participations
      UNION ALL
      SELECT 
        'Participations Approuvées',
        COUNT(*)
      FROM participations
      WHERE status = 'APPROVED'
      UNION ALL
      SELECT 
        'Zones Total',
        COUNT(*)
      FROM zones
      UNION ALL
      SELECT 
        'Accès Total',
        COUNT(*)
      FROM access_logs
      UNION ALL
      SELECT 
        'Messages Total',
        COUNT(*)
      FROM messages
    `);
    
    const headers = ['Métrique', 'Valeur'];
    const csv = jsonToCSV(eventStats, headers);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=statistics_${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting statistics:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
};

export const exportComplete = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const params: any[] = [];
    let dateFilter = '';
    
    if (startDate || endDate) {
      dateFilter = ' WHERE';
      const conditions: string[] = [];
      if (startDate) {
        conditions.push(' e.start_date >= ?');
        params.push(startDate);
      }
      if (endDate) {
        conditions.push(' e.end_date <= ?');
        params.push(endDate);
      }
      dateFilter += conditions.join(' AND');
    }
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        e.id as 'ID Événement',
        e.name as 'Événement',
        e.start_date as 'Date Début',
        e.end_date as 'Date Fin',
        e.status as 'Statut Événement',
        e.location as 'Lieu',
        u.email as 'Email Participant',
        CONCAT(u.first_name, ' ', u.last_name) as 'Nom Participant',
        p.status as 'Statut Participation',
        p.created_at as 'Date Inscription',
        p.qr_code as 'QR Code',
        COUNT(DISTINCT a.id) as 'Nombre Accès'
      FROM events e
      LEFT JOIN participations p ON e.id = p.event_id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN access_logs a ON p.id = a.participation_id
      ${dateFilter}
      GROUP BY e.id, p.id, u.id
      ORDER BY e.start_date DESC, p.created_at DESC
    `, params);
    
    const headers = ['ID Événement', 'Événement', 'Date Début', 'Date Fin', 'Statut Événement', 'Lieu', 'Email Participant', 'Nom Participant', 'Statut Participation', 'Date Inscription', 'QR Code', 'Nombre Accès'];
    const csv = jsonToCSV(rows, headers);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=export_complet_${Date.now()}.csv`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('Error exporting complete data:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
};
