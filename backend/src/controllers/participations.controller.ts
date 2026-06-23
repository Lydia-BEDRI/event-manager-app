import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import crypto from 'crypto';
import QRCode from 'qrcode';

export const getAllParticipations = async (_req: Request, res: Response) => {
  try {
    const [participations] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.id,
        p.user_id,
        p.event_id,
        p.status,
        p.qr_code,
        p.created_at,
        p.approved_at,
        u.email,
        u.first_name,
        u.last_name,
        e.name as event_name,
        e.location as event_location,
        e.start_date as event_start_date,
        approver.first_name as approved_by_first_name,
        approver.last_name as approved_by_last_name
      FROM participations p
      JOIN users u ON p.user_id = u.id
      JOIN events e ON p.event_id = e.id
      LEFT JOIN users approver ON p.approved_by = approver.id
      ORDER BY p.created_at DESC`
    );

    res.json(participations);
  } catch (error) {
    console.error('Error fetching participations:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getParticipationsByEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const [participations] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.id,
        p.user_id,
        p.event_id,
        p.status,
        p.qr_code,
        p.created_at,
        p.approved_at,
        u.email,
        u.first_name,
        u.last_name,
        e.name as event_name,
        e.location as event_location,
        e.start_date as event_start_date,
        approver.first_name as approved_by_first_name,
        approver.last_name as approved_by_last_name
      FROM participations p
      JOIN users u ON p.user_id = u.id
      JOIN events e ON p.event_id = e.id
      LEFT JOIN users approver ON p.approved_by = approver.id
      WHERE p.event_id = ?
      ORDER BY p.created_at DESC`,
      [eventId]
    );

    res.json(participations);
  } catch (error) {
    console.error('Error fetching participations by event:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getMyParticipantStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    const userId = req.user.userId;

    // statistiques des participations
    const [participationStats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_participations,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_participations,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_participations,
        SUM(CASE WHEN status = 'REFUSED' THEN 1 ELSE 0 END) as refused_participations
      FROM participations
      WHERE user_id = ?`,
      [userId]
    );

    // mes participations détaillées
    const [myParticipations] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.id,
        p.status,
        p.qr_code,
        p.created_at,
        p.approved_at,
        e.id as event_id,
        e.name as event_name,
        e.location as event_location,
        e.start_date as event_start_date,
        e.end_date as event_end_date,
        e.capacity as event_capacity,
        e.status as event_status
      FROM participations p
      JOIN events e ON p.event_id = e.id
      WHERE p.user_id = ?
      ORDER BY e.start_date DESC`,
      [userId]
    );

    // events disponibles (non inscrit et publiés)
    const [availableEvents] = await pool.query<RowDataPacket[]>(
      `SELECT 
        e.id,
        e.name,
        e.description,
        e.location,
        e.start_date,
        e.end_date,
        e.capacity,
        e.status,
        COUNT(p.id) as current_participants
      FROM events e
      LEFT JOIN participations p ON e.id = p.event_id AND p.status = 'APPROVED'
      WHERE e.status = 'PUBLISHED'
      AND e.id NOT IN (
        SELECT event_id FROM participations WHERE user_id = ?
      )
      AND e.start_date > NOW()
      GROUP BY e.id
      ORDER BY e.start_date ASC`,
      [userId]
    );

    // stats des accès zones
    const [zoneAccessStats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(DISTINCT al.zone_id) as unique_zones_visited,
        COUNT(al.id) as total_zone_accesses
      FROM access_logs al
      JOIN participations p ON al.participation_id = p.id
      WHERE p.user_id = ? AND al.is_valid = TRUE`,
      [userId]
    );

    // Mes événements à venir (approuvés)
    const [upcomingEvents] = await pool.query<RowDataPacket[]>(
      `SELECT 
        e.id,
        e.name,
        e.location,
        e.start_date,
        e.end_date,
        p.status,
        p.qr_code
      FROM participations p
      JOIN events e ON p.event_id = e.id
      WHERE p.user_id = ?
      AND p.status = 'APPROVED'
      AND e.start_date > NOW()
      ORDER BY e.start_date ASC
      LIMIT 5`,
      [userId]
    );

    // mes events passés (approuvés)
    const [pastEvents] = await pool.query<RowDataPacket[]>(
      `SELECT 
        e.id,
        e.name,
        e.location,
        e.start_date,
        e.end_date,
        p.status,
        COUNT(DISTINCT al.zone_id) as zones_visited
      FROM participations p
      JOIN events e ON p.event_id = e.id
      LEFT JOIN access_logs al ON p.id = al.participation_id AND al.is_valid = TRUE
      WHERE p.user_id = ?
      AND p.status = 'APPROVED'
      AND e.end_date < NOW()
      GROUP BY e.id, p.id
      ORDER BY e.end_date DESC
      LIMIT 5`,
      [userId]
    );

    res.json({
      stats: participationStats[0] || {
        total_participations: 0,
        approved_participations: 0,
        pending_participations: 0,
        refused_participations: 0
      },
      zoneAccess: zoneAccessStats[0] || {
        unique_zones_visited: 0,
        total_zone_accesses: 0
      },
      myParticipations: myParticipations || [],
      availableEvents: availableEvents || [],
      upcomingEvents: upcomingEvents || [],
      pastEvents: pastEvents || []
    });
  } catch (error) {
    console.error('Error fetching participant stats:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const requestParticipation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    const userId = req.user.userId;
    const eventId = Number(req.params.eventId);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      res.status(400).json({ message: 'Événement invalide' });
      return;
    }

    const [events] = await pool.query<RowDataPacket[]>(
      `SELECT 
        e.id,
        e.name,
        e.capacity,
        e.status,
        e.start_date,
        COUNT(CASE WHEN p.status = 'APPROVED' THEN 1 END) as approved_count
      FROM events e
      LEFT JOIN participations p ON p.event_id = e.id
      WHERE e.id = ?
      GROUP BY e.id`,
      [eventId]
    );

    if (events.length === 0) {
      res.status(404).json({ message: 'Événement non trouvé' });
      return;
    }

    const event = events[0];

    if (event.status !== 'PUBLISHED') {
      res.status(400).json({ message: 'Les inscriptions ne sont pas ouvertes pour cet événement' });
      return;
    }

    if (new Date(event.start_date) <= new Date()) {
      res.status(400).json({ message: 'Impossible de demander une participation à un événement déjà commencé' });
      return;
    }

    if (Number(event.approved_count) >= Number(event.capacity)) {
      res.status(400).json({ message: 'La capacité maximale de cet événement est atteinte' });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id, status FROM participations WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );

    if (existing.length > 0) {
      res.status(409).json({ message: 'Vous avez déjà une participation pour cet événement', participation: existing[0] });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO participations (user_id, event_id, status, created_at, updated_at)
       VALUES (?, ?, 'PENDING', NOW(), NOW())`,
      [userId, eventId]
    );

    const [participations] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.id,
        p.status,
        p.qr_code,
        p.created_at,
        p.approved_at,
        e.id as event_id,
        e.name as event_name,
        e.location as event_location,
        e.start_date as event_start_date,
        e.end_date as event_end_date,
        e.capacity as event_capacity,
        e.status as event_status
      FROM participations p
      JOIN events e ON p.event_id = e.id
      WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json(participations[0]);
  } catch (error) {
    console.error('Error requesting participation:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getMyQrCodes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    const [participations] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.id,
        p.event_id,
        p.qr_code,
        p.qr_code_data,
        e.name as event_name,
        e.location as event_location,
        e.start_date as event_start_date,
        e.end_date as event_end_date
      FROM participations p
      JOIN events e ON p.event_id = e.id
      WHERE p.user_id = ?
      AND p.status = 'APPROVED'
      AND p.qr_code IS NOT NULL
      ORDER BY e.start_date ASC`,
      [req.user.userId]
    );

    res.json(participations);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const generateParticipationQrCode = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    const participationId = Number(req.params.participationId);

    if (!Number.isInteger(participationId) || participationId <= 0) {
      res.status(400).json({ message: 'Participation invalide' });
      return;
    }

    const [participations] = await pool.query<RowDataPacket[]>(
      `SELECT id, user_id, event_id, status, qr_code, qr_code_data
       FROM participations
       WHERE id = ?`,
      [participationId]
    );

    if (participations.length === 0) {
      res.status(404).json({ message: 'Participation non trouvée' });
      return;
    }

    const participation = participations[0];
    const isOwner = Number(participation.user_id) === req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Accès refusé' });
      return;
    }

    if (participation.status !== 'APPROVED') {
      res.status(400).json({ message: 'Le QR code est disponible uniquement pour une participation approuvée' });
      return;
    }

    const code = participation.qr_code || `QR-EVT${participation.event_id}-USR${participation.user_id}-${crypto.randomBytes(8).toString('hex')}`;
    const qrCodeData = await QRCode.toDataURL(code);

    await pool.query(
      `UPDATE participations
       SET qr_code = ?, qr_code_data = ?, updated_at = NOW()
       WHERE id = ?`,
      [code, qrCodeData, participationId]
    );

    res.json({ id: participationId, qr_code: code, qr_code_data: qrCodeData });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const verifyPresence = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    const { qr_code, zone_id } = req.body;
    const zoneId = Number(zone_id);

    if (!qr_code || !Number.isInteger(zoneId) || zoneId <= 0) {
      res.status(400).json({ message: 'QR code et zone requis' });
      return;
    }

    const [participations] = await pool.query<RowDataPacket[]>(
      `SELECT 
        p.id,
        p.user_id,
        p.event_id,
        p.status,
        u.first_name,
        u.last_name,
        e.name as event_name,
        e.status as event_status,
        e.start_date,
        e.end_date
      FROM participations p
      JOIN users u ON u.id = p.user_id
      JOIN events e ON e.id = p.event_id
      WHERE p.qr_code = ?`,
      [qr_code]
    );

    if (participations.length === 0) {
      res.status(404).json({ message: 'QR code inconnu' });
      return;
    }

    const participation = participations[0];
    const isOwner = Number(participation.user_id) === req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Ce QR code ne vous appartient pas' });
      return;
    }

    if (participation.status !== 'APPROVED') {
      res.status(400).json({ message: 'Participation non approuvée' });
      return;
    }

    const [zones] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, event_id FROM zones WHERE id = ?',
      [zoneId]
    );

    if (zones.length === 0 || Number(zones[0].event_id) !== Number(participation.event_id)) {
      res.status(400).json({ message: 'Zone invalide pour cet événement' });
      return;
    }

    const [access] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM zone_access WHERE participation_id = ? AND zone_id = ?',
      [participation.id, zoneId]
    );

    if (access.length === 0) {
      await pool.query(
        `INSERT INTO access_logs (participation_id, zone_id, scanned_by, is_valid, rejection_reason, ip_address)
         VALUES (?, ?, ?, FALSE, ?, ?)`,
        [participation.id, zoneId, req.user.userId, 'Accès non autorisé à cette zone', req.ip]
      );
      res.status(403).json({ message: 'Accès non autorisé à cette zone' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO access_logs (participation_id, zone_id, scanned_by, is_valid, ip_address)
       VALUES (?, ?, ?, TRUE, ?)`,
      [participation.id, zoneId, req.user.userId, req.ip]
    );

    res.status(201).json({
      id: result.insertId,
      is_valid: true,
      participant_name: `${participation.first_name} ${participation.last_name}`,
      event_name: participation.event_name,
      zone_name: zones[0].name,
      scanned_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verifying presence:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
