import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

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
