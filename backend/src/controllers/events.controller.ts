import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT id, name, description, location, start_date, end_date, capacity, status, created_at 
      FROM events 
      ORDER BY start_date ASC
    `;

    const [events] = await pool.query<RowDataPacket[]>(query);

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [events] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    res.json(events[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};