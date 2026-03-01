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
  const connection = await pool.getConnection();
  
  try {
    const { name, description, location, start_date, end_date, capacity, status, zones } = req.body;
    const userId = (req as any).user.userId;

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

    if (zones && Array.isArray(zones) && zones.length > 0) {
      const totalZonesCapacity = zones.reduce((sum: number, zone: any) => sum + (zone.capacity || 0), 0);

      if (capacity > totalZonesCapacity) {
        return res.status(400).json({ 
          message: `La capacité de l'événement (${capacity}) ne peut pas être supérieure à la somme des capacités des zones (${totalZonesCapacity})` 
        });
      }

      for (const zone of zones) {
        if (!zone.name || !zone.capacity) {
          return res.status(400).json({ 
            message: 'Chaque zone doit avoir un nom et une capacité' 
          });
        }

        if (zone.capacity <= 0) {
          return res.status(400).json({ 
            message: `La capacité de la zone "${zone.name}" doit être supérieure à 0` 
          });
        }
      }
    }

    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO events (name, description, location, start_date, end_date, capacity, status, created_by, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, description || null, location, start_date, end_date, capacity, status || 'DRAFT', userId]
    );

    const eventId = result.insertId;

    if (zones && Array.isArray(zones) && zones.length > 0) {
      await Promise.all(
        zones.map(zone => 
          connection.query<ResultSetHeader>(
            `INSERT INTO zones (event_id, name, description, capacity, created_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [eventId, zone.name, zone.description || null, zone.capacity]
          )
        )
      );
    }

    await connection.commit();

    const [newEvent] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM events WHERE id = ?',
      [eventId]
    );

    const [eventZones] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE event_id = ?',
      [eventId]
    );

    res.status(201).json({
      ...newEvent[0],
      zones: eventZones
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  } finally {
    connection.release();
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, location, start_date, end_date, capacity, status } = req.body;

    const [events] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
      return res.status(400).json({ 
        message: 'La date de fin doit être postérieure à la date de début' 
      });
    }

    if (capacity !== undefined && capacity <= 0) {
      return res.status(400).json({ 
        message: 'La capacité doit être supérieure à 0' 
      });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(end_date);
    }
    if (capacity !== undefined) {
      updates.push('capacity = ?');
      values.push(capacity);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedEvent] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );

    res.json(updatedEvent[0]);
  } catch (error) {
    console.error('Error updating event:', error);
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
