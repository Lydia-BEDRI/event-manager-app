import { Request, Response } from 'express';
import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const createZone = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { name, description, capacity } = req.body;

    const [events] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM events WHERE id = ?',
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO zones (event_id, name, description, capacity) VALUES (?, ?, ?, ?)',
      [eventId, name, description || null, capacity]
    );

    const [newZone] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json(newZone[0]);
  } catch (error) {
    console.error('Error creating zone:', error);
    return res.status(500).json({ message: 'Erreur serveur', error });
  }
};
export const getAllZones = async (_req: Request, res: Response) => {
  try {
    const query = `SELECT z.id, z.name, z.description, z.capacity, z.archived, z.created_at, z.event_id, e.name AS event_name
                    FROM zones z
                    LEFT JOIN events e ON z.event_id = e.id
                    WHERE z.archived = FALSE
                    ORDER BY z.created_at DESC`;
  
    const [zones] = await pool.query<RowDataPacket[]>(query);

    return res.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const getDistinctZones = async (_req: Request, res: Response) => {
  try {
    // recuperer les zones (sans doublons) par nom/description/capacité
    const query = `SELECT DISTINCT name, description, capacity
                   FROM zones
                   WHERE archived = FALSE
                   GROUP BY name, description, capacity
                   ORDER BY name ASC`;
  
    const [zones] = await pool.query<RowDataPacket[]>(query);

    return res.json(zones);
  } catch (error) {
    console.error('Error fetching distinct zones:', error);
    return res.status(500).json({ message: 'Erreur serveur', error });
  }
};


export const getEventZones = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const [zones] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE event_id = ? AND archived = FALSE ORDER BY created_at ASC',
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
    const { zoneId } = req.params;
    const { name, description, capacity } = req.body;

    const [zones] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE id = ?',
      [zoneId]
    );

    if (zones.length === 0) {
      return res.status(404).json({ message: 'Zone non trouvée' });
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

    values.push(zoneId);

    await pool.query(
      `UPDATE zones SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedZone] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE id = ?',
      [zoneId]
    );

    return res.json(updatedZone[0]);
  } catch (error) {
    console.error('Error updating zone:', error);
    return res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const deleteZone = async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;

    const [zones] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE id = ?',
      [zoneId]
    );

    if (zones.length === 0) {
      return res.status(404).json({ message: 'Zone non trouvée' });
    }

    await pool.query(
      'UPDATE zones SET archived = TRUE WHERE id = ?',
      [zoneId]
    );

    return res.json({ message: 'Zone archivée avec succès' });
  } catch (error) {
    console.error('Error archiving zone:', error);
    return res.status(500).json({ message: 'Erreur serveur', error });
  }
};