import { Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../config/database";
import { AuthenticatedRequest } from "../middlewares/authenticate";
import { generateAccessToken, verifyToken } from "../utils/jwt";

interface EventRow extends RowDataPacket {
  id: number;
  name: string;
}

interface ZoneRow extends RowDataPacket {
  id: number;
}

interface ParticipationRow extends RowDataPacket {
  id: number;
  user_id: number;
  status: string;
  qr_code: string | null;
  first_name: string;
  last_name: string;
  email: string;
}

/**
 * POST /api/access/verify
 * Vérifie l'accès d'un participant via JWT (QR ou NFC)
 * Prévient les doubles entrées et enregistre les logs
 */
export async function verifyAccess(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      console.warn("[ACCESS] verifyAccess: user non authentifié");
      res.status(401).json({ error: "Non authentifié." });
      return;
    }

    // Validation des entrées
    const eventId = Number.parseInt(String(req.body.eventId || ""), 10);
    const zoneIdRaw = req.body.zoneId;
    const rawToken = String(req.body.token || "").trim();

    if (Number.isNaN(eventId) || eventId <= 0) {
      console.warn("[ACCESS] verifyAccess: eventId invalide", {
        eventId,
        raw: req.body.eventId,
      });
      res.status(400).json({ error: "eventId invalide ou manquant." });
      return;
    }

    if (!rawToken || rawToken.length === 0) {
      console.warn("[ACCESS] verifyAccess: token manquant");
      res.status(400).json({ error: "Token manquant ou vide." });
      return;
    }

    if (rawToken.length > 2000) {
      console.warn("[ACCESS] verifyAccess: token trop long", {
        length: rawToken.length,
      });
      res.status(400).json({ error: "Token invalide (trop long)." });
      return;
    }

    // Vérifier et décoder le JWT
    let decoded;
    try {
      decoded = verifyToken(rawToken);
    } catch (err: any) {
      console.warn("[ACCESS] verifyAccess: token invalide ou expiré", {
        error: err.message,
      });
      res
        .status(401)
        .json({ authorized: false, reason: "Token invalide ou expiré." });
      return;
    }

    if (!decoded?.userId) {
      console.warn("[ACCESS] verifyAccess: userId manquant dans le token");
      res.status(401).json({ authorized: false, reason: "Token mal formé." });
      return;
    }

    // Vérifier que l'événement existe
    const [eventRows] = await pool.query<EventRow[]>(
      "SELECT id, name FROM events WHERE id = ? LIMIT 1",
      [eventId],
    );

    if (eventRows.length === 0) {
      console.warn("[ACCESS] verifyAccess: événement introuvable", { eventId });
      res
        .status(404)
        .json({ authorized: false, reason: "Événement introuvable." });
      return;
    }

    // Vérifier que l'utilisateur du token est participant à cet événement et approuvé
    const [participationRows] = await pool.query<ParticipationRow[]>(
      `SELECT p.id, p.user_id, p.status, p.qr_code, u.first_name, u.last_name, u.email
       FROM participations p
       JOIN users u ON u.id = p.user_id
       WHERE p.event_id = ? AND p.user_id = ?
       LIMIT 1`,
      [eventId, decoded.userId],
    );

    if (participationRows.length === 0) {
      console.warn("[ACCESS] verifyAccess: participant non inscrit", {
        eventId,
        userId: decoded.userId,
      });
      res.status(403).json({
        authorized: false,
        reason: "Vous n'êtes pas inscrit à cet événement.",
      });
      return;
    }

    const participation = participationRows[0];

    if (participation.status !== "APPROVED") {
      console.warn("[ACCESS] verifyAccess: participation non approuvée", {
        participationId: participation.id,
        status: participation.status,
      });
      res.status(403).json({
        authorized: false,
        reason: `Participation non approuvée (statut: ${participation.status}).`,
      });
      return;
    }

    // Déterminer la zone cible
    let zoneId: number;

    if (zoneIdRaw !== undefined && zoneIdRaw !== null && zoneIdRaw !== "") {
      zoneId = Number.parseInt(String(zoneIdRaw), 10);

      if (Number.isNaN(zoneId) || zoneId <= 0) {
        console.warn("[ACCESS] verifyAccess: zoneId invalide", {
          zoneId: zoneIdRaw,
        });
        res.status(400).json({ error: "zoneId invalide." });
        return;
      }
    } else {
      // Utiliser la première zone de l'événement par défaut
      const [defaultZoneRows] = await pool.query<ZoneRow[]>(
        "SELECT id FROM zones WHERE event_id = ? ORDER BY id ASC LIMIT 1",
        [eventId],
      );

      if (defaultZoneRows.length === 0) {
        console.warn("[ACCESS] verifyAccess: aucune zone configurée", {
          eventId,
        });
        res.status(400).json({
          authorized: false,
          reason: "Aucune zone configurée pour cet événement.",
        });
        return;
      }

      zoneId = defaultZoneRows[0].id;
    }

    // Valider que la zone appartient à l'événement
    const [zoneRows] = await pool.query<ZoneRow[]>(
      "SELECT id FROM zones WHERE id = ? AND event_id = ? LIMIT 1",
      [zoneId, eventId],
    );

    if (zoneRows.length === 0) {
      console.warn(
        "[ACCESS] verifyAccess: zone ne correspond pas à l'événement",
        {
          zoneId,
          eventId,
        },
      );
      res.status(400).json({
        authorized: false,
        reason: "La zone ne correspond pas à l'événement.",
      });
      return;
    }

    // Vérifier que le participant n'a pas déjà scanné cette zone
    const [alreadyScannedRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, scanned_at
       FROM access_logs
       WHERE participation_id = ? AND zone_id = ? AND is_valid = TRUE
       LIMIT 1`,
      [participation.id, zoneId],
    );

    if (alreadyScannedRows.length > 0) {
      console.info("[ACCESS] verifyAccess: participant déjà scanné", {
        participationId: participation.id,
        zoneId,
        previousScan: (alreadyScannedRows[0] as any).scanned_at,
      });
      res.status(409).json({
        authorized: false,
        reason: "Vous avez déjà accédé à cette zone.",
        participant: {
          id: participation.user_id,
          fullName: `${participation.first_name} ${participation.last_name}`,
          email: participation.email,
        },
      });
      return;
    }

    // Insérer le log d'accès et marquer comme auto
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO access_logs (participation_id, zone_id, scanned_by, scanned_at, is_valid, ip_address)
         VALUES (?, ?, ?, NOW(), TRUE, ?)`,
        [participation.id, zoneId, req.user.userId, req.ip || "unknown"],
      );

      // Optionnel: mettre à jour un compteur ou statut
      // await connection.query('UPDATE participations SET last_scanned_at = NOW() WHERE id = ?', [participation.id]);

      await connection.commit();
    } catch (txError) {
      await connection.rollback();
      console.error("[ACCESS] verifyAccess: erreur insertion log", {
        error: txError,
        participationId: participation.id,
      });
      res
        .status(500)
        .json({ error: "Erreur lors de l'enregistrement de l'accès." });
      return;
    } finally {
      connection.release();
    }

    console.info("[ACCESS] verifyAccess: accès accordé", {
      participationId: participation.id,
      eventId,
      zoneId,
      userId: decoded.userId,
    });

    // Succès
    res.json({
      authorized: true,
      participant: {
        id: participation.user_id,
        fullName: `${participation.first_name} ${participation.last_name}`,
        email: participation.email,
      },
      event: {
        id: eventRows[0].id,
        name: eventRows[0].name,
      },
      zoneId,
      scannedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[ACCESS] verifyAccess: exception non gérée", error);
    res.status(500).json({
      error: "Erreur serveur interne. Veuillez réessayer.",
      debug: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * GET /api/access/events/:eventId/participants
 * Liste les participants approuvés d'un événement
 * Utilisé par l'admin pour préparer les badges NFC
 */
export async function listEventApprovedParticipants(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Non authentifié." });
      return;
    }

    const eventId = Number.parseInt(String(req.params.eventId || ""), 10);

    if (Number.isNaN(eventId) || eventId <= 0) {
      console.warn("[ACCESS] listEventApprovedParticipants: eventId invalide", {
        eventId,
        raw: req.params.eventId,
      });
      res.status(400).json({ error: "eventId invalide." });
      return;
    }

    // Vérifier que l'événement existe
    const [eventCheck] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM events WHERE id = ? LIMIT 1",
      [eventId],
    );

    if (eventCheck.length === 0) {
      console.warn(
        "[ACCESS] listEventApprovedParticipants: événement introuvable",
        { eventId },
      );
      res.status(404).json({ error: "Événement introuvable." });
      return;
    }

    // Récupérer les participants approuvés
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        p.id AS participationId,
        p.user_id AS userId,
        p.qr_code AS qrCode,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email AS email
      FROM participations p
      JOIN users u ON u.id = p.user_id
      WHERE p.event_id = ? AND p.status = 'APPROVED'
      ORDER BY u.last_name ASC, u.first_name ASC`,
      [eventId],
    );

    console.info("[ACCESS] listEventApprovedParticipants: liste générée", {
      eventId,
      count: rows.length,
    });

    res.json({ participants: rows, count: rows.length });
  } catch (error: any) {
    console.error(
      "[ACCESS] listEventApprovedParticipants: erreur non gérée",
      error,
    );
    res.status(500).json({
      error: "Erreur lors de la récupération des participants.",
      debug: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * POST /api/access/badge-token
 * Génère un JWT pour un participant afin de l'écrire sur un badge NFC
 * Utilisé par l'admin sans engagement préalable du participant
 */
export async function generateBadgeToken(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Non authentifié." });
      return;
    }

    const eventId = Number.parseInt(String(req.body.eventId || ""), 10);
    const participationId = Number.parseInt(
      String(req.body.participationId || ""),
      10,
    );

    if (Number.isNaN(eventId) || eventId <= 0) {
      console.warn("[ACCESS] generateBadgeToken: eventId invalide", {
        eventId,
        raw: req.body.eventId,
      });
      res.status(400).json({ error: "eventId invalide." });
      return;
    }

    if (Number.isNaN(participationId) || participationId <= 0) {
      console.warn("[ACCESS] generateBadgeToken: participationId invalide", {
        participationId,
        raw: req.body.participationId,
      });
      res.status(400).json({ error: "participationId invalide." });
      return;
    }

    // Vérifier que la participation existe, est approuvée et appartient à l'événement
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, u.id, u.email, u.role, u.first_name, u.last_name
       FROM participations p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = ? AND p.event_id = ? AND p.status = 'APPROVED'
       LIMIT 1`,
      [participationId, eventId],
    );

    if (rows.length === 0) {
      console.warn(
        "[ACCESS] generateBadgeToken: participation approuvée introuvable",
        {
          participationId,
          eventId,
        },
      );
      res.status(404).json({
        error: "Participation approuvée introuvable pour cet événement.",
      });
      return;
    }

    const user = rows[0] as any;

    // Générer le token pour ce participant
    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role || "PARTICIPANT",
    });

    console.info("[ACCESS] generateBadgeToken: token généré", {
      participationId,
      eventId,
      userId: user.id,
      userName: `${user.first_name} ${user.last_name}`,
    });

    res.json({
      token,
      participationId,
      userId: user.id,
      userName: `${user.first_name} ${user.last_name}`,
      email: user.email,
    });
  } catch (error: any) {
    console.error("[ACCESS] generateBadgeToken: erreur non gérée", error);
    res.status(500).json({
      error: "Erreur lors de la génération du token.",
      debug: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
