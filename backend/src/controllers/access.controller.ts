import { Response } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from '../config/database';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import { verifyAccessScan } from '../services/access-control.service';
import {
  generateSignedAccessQr,
  isReusableAccessQrToken,
  renderAccessQrDataUrl,
} from '../services/access-qr.service';

function parsePositiveInteger(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function verifyAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifie' });
      return;
    }

    const token = String(req.body.token || req.body.qr_code || '').trim();
    const zoneId = parsePositiveInteger(req.body.zoneId ?? req.body.zone_id);

    if (!token) {
      res.status(400).json({ authorized: false, message: 'QR code requis' });
      return;
    }

    if (!zoneId) {
      res.status(400).json({ authorized: false, message: 'Zone requise' });
      return;
    }

    const result = await verifyAccessScan({
      token,
      zoneId,
      scannedBy: req.user.userId,
      ipAddress: req.ip,
    });

    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Error verifying access:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}

export async function listEventApprovedParticipants(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifie' });
      return;
    }

    const eventId = parsePositiveInteger(req.params.eventId);
    if (!eventId) {
      res.status(400).json({ message: 'Evenement invalide' });
      return;
    }

    const [participants] = await pool.query<RowDataPacket[]>(
      `SELECT
        p.id AS participationId,
        p.user_id AS userId,
        p.qr_code AS qrCode,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email,
        u.avatar_url AS avatarUrl
       FROM participations p
       JOIN users u ON u.id = p.user_id
       WHERE p.event_id = ? AND p.status = 'APPROVED'
       ORDER BY u.last_name ASC, u.first_name ASC`,
      [eventId],
    );

    res.json({ participants, count: participants.length });
  } catch (error) {
    console.error('Error listing approved participants:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}

export async function generateBadgeToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifie' });
      return;
    }

    const participationId = parsePositiveInteger(req.body.participationId);
    const eventId = parsePositiveInteger(req.body.eventId);

    if (!participationId || !eventId) {
      res.status(400).json({ message: 'Participation et evenement requis' });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, p.user_id, p.event_id, p.status, p.qr_code, p.qr_code_data,
              u.first_name, u.last_name, u.email
       FROM participations p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ? AND p.event_id = ?
       LIMIT 1`,
      [participationId, eventId],
    );

    if (rows.length === 0) {
      res.status(404).json({ message: 'Participation introuvable' });
      return;
    }

    const participation = rows[0];

    if (participation.status !== 'APPROVED') {
      res.status(400).json({ message: 'QR disponible uniquement pour une participation approuvee' });
      return;
    }

    let token = participation.qr_code as string | null;
    let qrCodeData = participation.qr_code_data as string | null;

    if (!isReusableAccessQrToken(token, participation as any)) {
      const generated = await generateSignedAccessQr(participation as any);
      token = generated.token;
      qrCodeData = generated.dataUrl;

      await pool.query(
        `UPDATE participations
         SET qr_code = ?, qr_code_data = ?, updated_at = NOW()
         WHERE id = ?`,
        [token, qrCodeData, participationId],
      );
    } else if (!qrCodeData && token) {
      qrCodeData = await renderAccessQrDataUrl(token);
      await pool.query(
        `UPDATE participations
         SET qr_code_data = ?, updated_at = NOW()
         WHERE id = ?`,
        [qrCodeData, participationId],
      );
    }

    res.json({
      token,
      qr_code: token,
      qr_code_data: qrCodeData,
      participationId,
      userId: Number(participation.user_id),
      userName: `${participation.first_name} ${participation.last_name}`,
      email: participation.email,
    });
  } catch (error) {
    console.error('Error generating badge token:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}
