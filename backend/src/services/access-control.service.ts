import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';
import { verifySignedAccessQr } from './access-qr.service';

interface ParticipationScanRow extends RowDataPacket {
  id: number;
  user_id: number;
  event_id: number;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
  event_name: string;
}

interface ZoneScanRow extends RowDataPacket {
  id: number;
  name: string;
  event_id: number;
}

interface ExistingScanRow extends RowDataPacket {
  id: number;
  scanned_at: Date;
}

export interface VerifyAccessScanInput {
  token: string;
  zoneId: number;
  scannedBy: number;
  ipAddress?: string;
  expectedUserId?: number;
}

export interface AccessScanResult {
  statusCode: number;
  authorized: boolean;
  reason?: string;
  id?: number;
  is_valid: boolean;
  participant?: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  participant_name?: string;
  event?: {
    id: number;
    name: string;
  };
  event_name?: string;
  zone?: {
    id: number;
    name: string;
  };
  zone_name?: string;
  scanned_at: string;
}

async function resolveExistingZoneId(zoneId: number): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM zones WHERE id = ? LIMIT 1',
    [zoneId],
  );

  return rows.length > 0 ? Number(rows[0].id) : null;
}

async function logRejectedScan(
  scannedBy: number,
  reason: string,
  ipAddress: string | undefined,
  participationId: number | null,
  zoneId: number | null,
): Promise<number | undefined> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO access_logs (participation_id, zone_id, scanned_by, is_valid, rejection_reason, ip_address)
     VALUES (?, ?, ?, FALSE, ?, ?)`,
    [participationId, zoneId, scannedBy, reason, ipAddress || null],
  );

  return result.insertId;
}

function toResult(
  statusCode: number,
  authorized: boolean,
  reason: string | undefined,
  logId: number | undefined,
  participation: ParticipationScanRow | null,
  zone: ZoneScanRow | null,
): AccessScanResult {
  const participantName = participation
    ? `${participation.first_name} ${participation.last_name}`
    : undefined;

  return {
    statusCode,
    authorized,
    reason,
    id: logId,
    is_valid: authorized,
    participant: participation
      ? {
          id: Number(participation.user_id),
          fullName: participantName || '',
          email: participation.email,
          avatarUrl: participation.avatar_url,
        }
      : undefined,
    participant_name: participantName,
    event: participation
      ? {
          id: Number(participation.event_id),
          name: participation.event_name,
        }
      : undefined,
    event_name: participation?.event_name,
    zone: zone
      ? {
          id: Number(zone.id),
          name: zone.name,
        }
      : undefined,
    zone_name: zone?.name,
    scanned_at: new Date().toISOString(),
  };
}

export async function verifyAccessScan(input: VerifyAccessScanInput): Promise<AccessScanResult> {
  let payload;

  try {
    payload = verifySignedAccessQr(input.token);
  } catch {
    const existingZoneId = await resolveExistingZoneId(input.zoneId);
    const logId = await logRejectedScan(
      input.scannedBy,
      'QR invalide ou signature incorrecte',
      input.ipAddress,
      null,
      existingZoneId,
    );
    return toResult(401, false, 'QR invalide ou signature incorrecte', logId, null, null);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [participations] = await connection.query<ParticipationScanRow[]>(
      `SELECT
        p.id,
        p.user_id,
        p.event_id,
        p.status,
        u.first_name,
        u.last_name,
        u.email,
        u.avatar_url,
        e.name as event_name
       FROM participations p
       JOIN users u ON u.id = p.user_id
       JOIN events e ON e.id = p.event_id
       WHERE p.id = ?
       LIMIT 1
       FOR UPDATE`,
      [payload.participationId],
    );

    if (participations.length === 0) {
      await connection.commit();
      const existingZoneId = await resolveExistingZoneId(input.zoneId);
      const logId = await logRejectedScan(
        input.scannedBy,
        'Participation introuvable',
        input.ipAddress,
        null,
        existingZoneId,
      );
      return toResult(404, false, 'Participation introuvable', logId, null, null);
    }

    const participation = participations[0];

    const payloadMatchesParticipation =
      Number(participation.user_id) === payload.userId &&
      Number(participation.event_id) === payload.eventId;
    const payloadMatchesExpectedUser =
      input.expectedUserId === undefined || payload.userId === input.expectedUserId;

    if (!payloadMatchesParticipation || !payloadMatchesExpectedUser) {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO access_logs (participation_id, zone_id, scanned_by, is_valid, rejection_reason, ip_address)
         VALUES (?, NULL, ?, FALSE, ?, ?)`,
        [
          participation.id,
          input.scannedBy,
          'QR ne correspond pas au participant attendu',
          input.ipAddress || null,
        ],
      );
      await connection.commit();
      return toResult(
        403,
        false,
        'QR ne correspond pas au participant attendu',
        result.insertId,
        participation,
        null,
      );
    }

    if (participation.status !== 'APPROVED') {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO access_logs (participation_id, zone_id, scanned_by, is_valid, rejection_reason, ip_address)
         VALUES (?, NULL, ?, FALSE, ?, ?)`,
        [
          participation.id,
          input.scannedBy,
          'Participation non approuvee',
          input.ipAddress || null,
        ],
      );
      await connection.commit();
      return toResult(403, false, 'Participation non approuvee', result.insertId, participation, null);
    }

    const [zones] = await connection.query<ZoneScanRow[]>(
      'SELECT id, name, event_id FROM zones WHERE id = ? LIMIT 1',
      [input.zoneId],
    );

    if (zones.length === 0 || Number(zones[0].event_id) !== Number(participation.event_id)) {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO access_logs (participation_id, zone_id, scanned_by, is_valid, rejection_reason, ip_address)
         VALUES (?, NULL, ?, FALSE, ?, ?)`,
        [
          participation.id,
          input.scannedBy,
          'Zone invalide pour cet evenement',
          input.ipAddress || null,
        ],
      );
      await connection.commit();
      return toResult(400, false, 'Zone invalide pour cet evenement', result.insertId, participation, null);
    }

    const zone = zones[0];

    const [zoneAccess] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM zone_access WHERE participation_id = ? AND zone_id = ? LIMIT 1',
      [participation.id, zone.id],
    );

    if (zoneAccess.length === 0) {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO access_logs (participation_id, zone_id, scanned_by, is_valid, rejection_reason, ip_address)
         VALUES (?, ?, ?, FALSE, ?, ?)`,
        [
          participation.id,
          zone.id,
          input.scannedBy,
          'Acces non autorise a cette zone',
          input.ipAddress || null,
        ],
      );
      await connection.commit();
      return toResult(403, false, 'Acces non autorise a cette zone', result.insertId, participation, zone);
    }

    const [existingScans] = await connection.query<ExistingScanRow[]>(
      `SELECT id, scanned_at
       FROM access_logs
       WHERE participation_id = ? AND zone_id = ? AND is_valid = TRUE
       LIMIT 1
       FOR UPDATE`,
      [participation.id, zone.id],
    );

    if (existingScans.length > 0) {
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO access_logs (participation_id, zone_id, scanned_by, is_valid, rejection_reason, ip_address)
         VALUES (?, ?, ?, FALSE, ?, ?)`,
        [
          participation.id,
          zone.id,
          input.scannedBy,
          'Deja scanne pour cette zone',
          input.ipAddress || null,
        ],
      );
      await connection.commit();
      return toResult(409, false, 'Deja scanne pour cette zone', result.insertId, participation, zone);
    }

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO access_logs (participation_id, zone_id, scanned_by, is_valid, ip_address)
       VALUES (?, ?, ?, TRUE, ?)`,
      [participation.id, zone.id, input.scannedBy, input.ipAddress || null],
    );

    await connection.commit();
    return toResult(201, true, undefined, result.insertId, participation, zone);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
