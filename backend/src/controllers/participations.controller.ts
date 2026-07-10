import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import { createNotification, Notification } from '../services/notification.service';
import { emitNotification } from '../sockets/server.socket';
import {
  generateSignedAccessQr,
  isReusableAccessQrToken,
  renderAccessQrDataUrl,
} from '../services/access-qr.service';

interface ParticipationQrSubject {
  id: number;
  user_id: number;
  event_id: number;
  qr_code: string | null;
  qr_code_data?: string | null;
}

async function buildQrForParticipation(participation: ParticipationQrSubject) {
  if (isReusableAccessQrToken(participation.qr_code, participation)) {
    return {
      qrCode: participation.qr_code,
      qrCodeData: participation.qr_code_data || await renderAccessQrDataUrl(participation.qr_code as string),
    };
  }

  const generated = await generateSignedAccessQr(participation);
  return {
    qrCode: generated.token,
    qrCodeData: generated.dataUrl,
  };
}

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
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
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
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
};

export const updateParticipationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
  let notification: Notification | null = null;

  try {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    const participationId = Number(req.params.participationId);
    const { status } = req.body;

    if (!Number.isInteger(participationId) || participationId <= 0) {
      res.status(400).json({ message: 'Participation invalide' });
      return;
    }

    if (!['APPROVED', 'REFUSED'].includes(status)) {
      res.status(400).json({ message: 'Statut invalide' });
      return;
    }

    await connection.beginTransaction();

    const [participations] = await connection.query<RowDataPacket[]>(
      `SELECT 
        p.id,
        p.user_id,
        p.event_id,
        p.status,
        p.qr_code,
        p.qr_code_data,
        e.capacity,
        e.name as event_name,
        COUNT(CASE WHEN approved_p.status = 'APPROVED' THEN 1 END) as approved_count
      FROM participations p
      JOIN events e ON e.id = p.event_id
      LEFT JOIN participations approved_p ON approved_p.event_id = e.id AND approved_p.status = 'APPROVED'
      WHERE p.id = ?
      GROUP BY p.id, e.id`,
      [participationId]
    );

    if (participations.length === 0) {
      await connection.rollback();
      res.status(404).json({ message: 'Participation non trouvée' });
      return;
    }

    const participation = participations[0];

    if (
      status === 'APPROVED' &&
      participation.status !== 'APPROVED' &&
      Number(participation.approved_count) >= Number(participation.capacity)
    ) {
      await connection.rollback();
      res.status(400).json({ message: 'La capacité maximale de cet événement est atteinte' });
      return;
    }

    const qrPayload = status === 'APPROVED'
      ? await buildQrForParticipation({
          id: participation.id,
          user_id: participation.user_id,
          event_id: participation.event_id,
          qr_code: participation.qr_code,
          qr_code_data: participation.qr_code_data,
        })
      : { qrCode: null, qrCodeData: null };

    await connection.query(
      `UPDATE participations
       SET status = ?,
           qr_code = ?,
           qr_code_data = ?,
           approved_by = ?,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [status, qrPayload.qrCode, qrPayload.qrCodeData, req.user.userId, participationId]
    );

    await connection.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, ?, 'participation', ?, ?)`,
      [
        req.user.userId,
        status === 'APPROVED' ? 'APPROVE_PARTICIPATION' : 'REFUSE_PARTICIPATION',
        participationId,
        req.ip
      ]
    );

    if (participation.status !== status) {
      notification = await createNotification({
        userId: participation.user_id,
        title: status === 'APPROVED' ? 'Participation approuvée' : 'Participation refusée',
        body: status === 'APPROVED'
          ? `Votre participation à "${participation.event_name}" a été approuvée.`
          : `Votre participation à "${participation.event_name}" a été refusée.`,
        type: status === 'APPROVED' ? 'PARTICIPATION_APPROVED' : 'PARTICIPATION_REFUSED',
        referenceType: 'participation',
        referenceId: participationId,
      }, connection);
    }

    await connection.commit();
    if (notification) {
      emitNotification(notification);
    }

    const [updatedParticipation] = await connection.query<RowDataPacket[]>(
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
      WHERE p.id = ?`,
      [participationId]
    );

    res.json(updatedParticipation[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error updating participation status:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  } finally {
    connection.release();
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
        COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END), 0) as approved_participations,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) as pending_participations,
        COALESCE(SUM(CASE WHEN status = 'REFUSED' THEN 1 ELSE 0 END), 0) as refused_participations
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

    const rawStats = participationStats[0] || {};
    const rawZoneAccess = zoneAccessStats[0] || {};

    res.json({
      stats: {
        total_participations: Number(rawStats.total_participations ?? 0),
        approved_participations: Number(rawStats.approved_participations ?? 0),
        pending_participations: Number(rawStats.pending_participations ?? 0),
        refused_participations: Number(rawStats.refused_participations ?? 0)
      },
      zoneAccess: {
        unique_zones_visited: Number(rawZoneAccess.unique_zones_visited ?? 0),
        total_zone_accesses: Number(rawZoneAccess.total_zone_accesses ?? 0)
      },
      myParticipations: myParticipations || [],
      availableEvents: availableEvents || [],
      upcomingEvents: upcomingEvents || [],
      pastEvents: pastEvents || []
    });
  } catch (error) {
    console.error('Error fetching participant stats:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
};

export const requestParticipation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const connection = await pool.getConnection();
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

    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO participations (user_id, event_id, status, created_at, updated_at)
       VALUES (?, ?, 'PENDING', NOW(), NOW())`,
      [userId, eventId]
    );

    const [participations] = await connection.query<RowDataPacket[]>(
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

    const [recipients] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE role = 'ADMIN' AND is_active = TRUE`
    );
    const [requesters] = await connection.query<RowDataPacket[]>(
      `SELECT first_name, last_name FROM users WHERE id = ?`,
      [userId]
    );
    const requesterName = requesters.length > 0
      ? `${requesters[0].first_name} ${requesters[0].last_name}`
      : 'Un participant';
    const notifications: Notification[] = [];

    for (const recipient of recipients) {
      notifications.push(await createNotification({
        userId: recipient.id,
        title: 'Nouvelle demande de participation',
        body: `${requesterName} souhaite participer à "${event.name}".`,
        type: 'PARTICIPATION_REQUEST',
        referenceType: 'participation',
        referenceId: result.insertId,
      }, connection));
    }

    await connection.commit();
    notifications.forEach((createdNotification) => emitNotification(createdNotification));

    res.status(201).json(participations[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error requesting participation:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  } finally {
    connection.release();
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
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
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

    const qrPayload = await buildQrForParticipation({
      id: participation.id,
      user_id: participation.user_id,
      event_id: participation.event_id,
      qr_code: participation.qr_code,
      qr_code_data: participation.qr_code_data,
    });

    await pool.query(
      `UPDATE participations
       SET qr_code = ?, qr_code_data = ?, updated_at = NOW()
       WHERE id = ?`,
      [qrPayload.qrCode, qrPayload.qrCodeData, participationId]
    );

    res.json({ id: participationId, qr_code: qrPayload.qrCode, qr_code_data: qrPayload.qrCodeData });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
};
