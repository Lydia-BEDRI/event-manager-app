import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const createZone = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { name, description, capacity } = req.body;

    const [events] = await pool.query<RowDataPacket[]>(
      'SELECT id, capacity FROM events WHERE id = ?',
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    if (capacity > events[0].capacity) {
      return res.status(400).json({ 
        message: `La capacité de la zone (${capacity}) ne peut pas dépasser celle de l'événement (${events[0].capacity})` 
      });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO zones (event_id, name, description, capacity) VALUES (?, ?, ?, ?)',
      [eventId, name, description || null, capacity]
    );

    const [newZone] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newZone[0]);
  } catch (error) {
    console.error('Error creating zone:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
export const getAllZones = async (req: Request, res: Response) => {
  try {
    const query = `SELECT z.id, z.name, z.description, z.capacity, z.created_at, z.event_id, e.name AS event_name
                    FROM zones z
                    LEFT JOIN events e ON z.event_id = e.id
                    ORDER BY z.created_at DESC`;
  
    const [zones] = await pool.query<RowDataPacket[]>(query);

    res.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getDistinctZones = async (req: Request, res: Response) => {
  try {
    // recuperer les zones (sans doublons) par nom/description/capacité
    const query = `SELECT DISTINCT name, description, capacity
                   FROM zones
                   GROUP BY name, description, capacity
                   ORDER BY name ASC`;
  
    const [zones] = await pool.query<RowDataPacket[]>(query);

    res.json(zones);
  } catch (error) {
    console.error('Error fetching distinct zones:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};


export const getEventZones = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const [zones] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE event_id = ? ORDER BY created_at ASC',
      [eventId]
    );

    res.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const updateZone = async (req: Request, res: Response) => {
  try {
    const { eventId, zoneId } = req.params;
    const { name, description, capacity } = req.body;

    const [zones] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE id = ? AND event_id = ?',
      [zoneId, eventId]
    );

    if (zones.length === 0) {
      return res.status(404).json({ message: 'Zone non trouvée' });
    }

    if (capacity) {
      const [events] = await pool.query<RowDataPacket[]>(
        'SELECT capacity FROM events WHERE id = ?',
        [eventId]
      );

      if (capacity > events[0].capacity) {
        return res.status(400).json({ 
          message: `La capacité de la zone (${capacity}) ne peut pas dépasser celle de l'événement (${events[0].capacity})` 
        });
      }
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
    if (capacity !== undefined) {
      updates.push('capacity = ?');
      values.push(capacity);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
    }

    values.push(zoneId, eventId);

    await pool.query(
      `UPDATE zones SET ${updates.join(', ')} WHERE id = ? AND event_id = ?`,
      values
    );

    const [updatedZone] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE id = ?',
      [zoneId]
    );

    res.json(updatedZone[0]);
  } catch (error) {
    console.error('Error updating zone:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const deleteZone = async (req: Request, res: Response) => {
  try {
    const { eventId, zoneId } = req.params;

    const [zones] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE id = ? AND event_id = ?',
      [zoneId, eventId]
    );

    if (zones.length === 0) {
      return res.status(404).json({ message: 'Zone non trouvée' });
    }

    await pool.query('DELETE FROM zones WHERE id = ?', [zoneId]);

    res.json({ message: 'Zone supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting zone:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};