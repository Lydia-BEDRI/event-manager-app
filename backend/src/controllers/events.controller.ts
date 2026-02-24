import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

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

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { name, description, location, start_date, end_date, capacity, status } = req.body;
    const userId = (req as any).user.userId; // Récupéré depuis le middleware authenticate

    
    if (!name || !location || !start_date || !end_date || !capacity) {
      return res.status(400).json({ 
        message: 'Les champs name, location, start_date, end_date et capacity sont requis' 
      });
    }

    if (new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ 
        message: 'La date de fin doit être postérieure à la date de début' 
      });
    }

    if (capacity <= 0) {
      return res.status(400).json({ 
        message: 'La capacité doit être supérieure à 0' 
      });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO events (name, description, location, start_date, end_date, capacity, status, created_by, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, description || null, location, start_date, end_date, capacity, status || 'DRAFT', userId]
    );

    const [newEvent] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM events WHERE id = ?',
      [result.insertId]
    );
        res.status(201).json(newEvent[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [events] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    await pool.query<ResultSetHeader>(
      'DELETE FROM events WHERE id = ?',
      [id]
    );

    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
