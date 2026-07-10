import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { createNotification, Notification } from '../services/notification.service';
import { emitNotification } from '../sockets/server.socket';

export const getAllEvents = async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT id, name, description, location, start_date, end_date, capacity, status, created_at 
      FROM events 
      ORDER BY start_date ASC
    `;

    const [events] = await pool.query<RowDataPacket[]>(query);

    return res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ message: 'Une erreur interne est survenue.' });
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

    return res.json(events[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    return res.status(500).json({ message: 'Une erreur interne est survenue.' });
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

    return res.status(201).json({
      ...newEvent[0],
      zones: eventZones
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error creating event:', error);
    return res.status(500).json({ message: 'Une erreur interne est survenue.' });
  } finally {
    connection.release();
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  const notifications: Notification[] = [];
  
  try {
    const { id } = req.params;
    const { name, description, location, start_date, end_date, capacity, status, zones } = req.body;

    const [events] = await connection.query<RowDataPacket[]>(
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

    // Validation des zones si présentes
    if (zones && Array.isArray(zones) && zones.length > 0) {
      const totalZonesCapacity = zones.reduce((sum: number, zone: any) => sum + (zone.capacity || 0), 0);

      if (capacity !== undefined && capacity > totalZonesCapacity) {
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

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(id);

      await connection.query(
        `UPDATE events SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Mettre à jour les zones en place pour préserver les accès et historiques.
    if (zones !== undefined) {
      const [existingZones] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM zones WHERE event_id = ? ORDER BY id ASC',
        [id]
      );
      const submittedZones = Array.isArray(zones) ? zones : [];
      const sharedLength = Math.min(existingZones.length, submittedZones.length);

      for (let index = 0; index < sharedLength; index += 1) {
        const zone = submittedZones[index];
        await connection.query(
          `UPDATE zones
           SET name = ?, description = ?, capacity = ?
           WHERE id = ? AND event_id = ?`,
          [zone.name, zone.description || null, zone.capacity, existingZones[index].id, id]
        );
      }

      for (let index = sharedLength; index < submittedZones.length; index += 1) {
        const zone = submittedZones[index];
        await connection.query<ResultSetHeader>(
          `INSERT INTO zones (event_id, name, description, capacity, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [id, zone.name, zone.description || null, zone.capacity]
        );
      }

      if (existingZones.length > submittedZones.length) {
        const zoneIdsToDelete = existingZones
          .slice(submittedZones.length)
          .map(zone => zone.id);
        const placeholders = zoneIdsToDelete.map(() => '?').join(', ');
        await connection.query(
          `DELETE FROM zones WHERE event_id = ? AND id IN (${placeholders})`,
          [id, ...zoneIdsToDelete]
        );
      }
    }

    if (updates.length > 0 || zones !== undefined) {
      const [participants] = await connection.query<RowDataPacket[]>(
        `SELECT DISTINCT user_id
         FROM participations
         WHERE event_id = ? AND status = 'APPROVED'`,
        [id]
      );
      const eventName = name ?? events[0].name;
      const cancelled = status === 'CANCELLED' && events[0].status !== 'CANCELLED';

      for (const participant of participants) {
        notifications.push(await createNotification({
          userId: participant.user_id,
          title: cancelled ? 'Événement annulé' : 'Événement mis à jour',
          body: cancelled
            ? `L'événement "${eventName}" a été annulé.`
            : `Les informations de l'événement "${eventName}" ont été modifiées.`,
          type: 'EVENT_UPDATE',
          referenceType: 'event',
          referenceId: Number(id),
        }, connection));
      }
    }

    await connection.commit();
    notifications.forEach((notification) => emitNotification(notification));

    const [updatedEvent] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );

    const [eventZones] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM zones WHERE event_id = ?',
      [id]
    );

    return res.json({
      ...updatedEvent[0],
      zones: eventZones
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating event:', error);
    if ((error as { errno?: number }).errno === 1451) {
      return res.status(409).json({
        message: "Une zone possédant un historique d'accès ne peut pas être supprimée."
      });
    }
    return res.status(500).json({ message: 'Une erreur interne est survenue.' });
  } finally {
    connection.release();
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

    return res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    return res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
};
