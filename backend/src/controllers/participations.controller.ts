import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { AuthenticatedRequest } from '../middlewares/authenticate';

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

export const getMyParticipations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifie' });
      return;
    }

    const userId = req.user.userId;

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
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(participations);
  } catch (error) {
    console.error('Error fetching my participations:', error);
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
      ORDER BY e.start_date DESC
      LIMIT 10`,
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
      ORDER BY e.start_date ASC
      LIMIT 10`,
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
