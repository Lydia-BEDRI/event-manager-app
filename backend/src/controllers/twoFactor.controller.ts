import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import QRCode from 'qrcode';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import {
  consumeBackupCode,
  createBackupCodes,
  createTwoFactorSecret,
  createTwoFactorUri,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  hashBackupCode,
  parseBackupCodeHashes,
  verifyTotpCode,
} from '../services/twoFactor.service';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshExpiresAt,
  verifyTwoFactorChallengeToken,
} from '../utils/jwt';
import { isPasswordExpired } from '../utils/password';

interface TwoFactorRow extends RowDataPacket {
  user_id: number;
  secret: string;
  is_enabled: boolean;
  backup_codes: string | string[] | null;
}

function getAuthenticatedUserId(req: AuthenticatedRequest, res: Response): number | null {
  if (!req.user) {
    res.status(401).json({ error: 'Non authentifié.' });
    return null;
  }

  return req.user.userId;
}

async function getTwoFactorRow(userId: number): Promise<TwoFactorRow | null> {
  const [rows] = await pool.query<TwoFactorRow[]>(
    'SELECT user_id, secret, is_enabled, backup_codes FROM two_factor_auth WHERE user_id = ?',
    [userId],
  );

  return rows[0] || null;
}

async function validateSecondFactor(
  row: TwoFactorRow,
  code: string,
): Promise<{ valid: boolean; backupCodeHash?: string }> {
  const normalizedCode = code.trim();
  const secret = decryptTwoFactorSecret(row.secret);

  if (await verifyTotpCode(secret, normalizedCode)) {
    return { valid: true };
  }

  const backupCodes = parseBackupCodeHashes(row.backup_codes);
  const result = consumeBackupCode(normalizedCode, backupCodes);
  return result.valid
    ? { valid: true, backupCodeHash: hashBackupCode(normalizedCode) }
    : { valid: false };
}

export async function getTwoFactorStatus(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  try {
    const row = await getTwoFactorRow(userId);
    res.json({
      enabled: Boolean(row?.is_enabled),
      backupCodesRemaining: row?.is_enabled
        ? parseBackupCodeHashes(row.backup_codes).length
        : 0,
    });
  } catch (error) {
    console.error('Erreur statut 2FA:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

export async function setupTwoFactor(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId || !req.user) return;

  try {
    const current = await getTwoFactorRow(userId);
    if (current?.is_enabled) {
      res.status(409).json({ error: 'La double authentification est déjà activée.' });
      return;
    }

    const secret = createTwoFactorSecret();
    const encryptedSecret = encryptTwoFactorSecret(secret);
    const uri = createTwoFactorUri(req.user.email, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(uri, { width: 240, margin: 1 });

    await pool.query(
      `INSERT INTO two_factor_auth (user_id, secret, is_enabled, backup_codes)
       VALUES (?, ?, FALSE, NULL)
       ON DUPLICATE KEY UPDATE secret = VALUES(secret), is_enabled = FALSE, backup_codes = NULL`,
      [userId, encryptedSecret],
    );

    res.json({ secret, qrCodeDataUrl });
  } catch (error) {
    console.error('Erreur configuration 2FA:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

export async function enableTwoFactor(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const code = typeof req.body.code === 'string' ? req.body.code : '';
  if (!code) {
    res.status(400).json({ error: 'Code de vérification requis.' });
    return;
  }

  try {
    const row = await getTwoFactorRow(userId);
    if (!row || row.is_enabled) {
      res.status(409).json({ error: 'Aucune configuration 2FA en attente.' });
      return;
    }

    const secret = decryptTwoFactorSecret(row.secret);
    if (!await verifyTotpCode(secret, code.trim())) {
      res.status(400).json({ error: 'Code de vérification invalide.' });
      return;
    }

    const backupCodes = createBackupCodes();
    await pool.query(
      'UPDATE two_factor_auth SET is_enabled = TRUE, backup_codes = ? WHERE user_id = ?',
      [JSON.stringify(backupCodes.hashedCodes), userId],
    );
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'ENABLE_2FA', 'user', ?, ?)`,
      [userId, userId, req.ip],
    );

    res.json({
      message: 'Double authentification activée.',
      backupCodes: backupCodes.plainCodes,
    });
  } catch (error) {
    console.error('Erreur activation 2FA:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

export async function disableTwoFactor(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const code = typeof req.body.code === 'string' ? req.body.code : '';
  if (!password || !code) {
    res.status(400).json({ error: 'Mot de passe et code de vérification requis.' });
    return;
  }

  try {
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId],
    );
    const row = await getTwoFactorRow(userId);

    if (!users[0] || !row?.is_enabled) {
      res.status(409).json({ error: 'La double authentification n’est pas activée.' });
      return;
    }

    if (!await bcrypt.compare(password, users[0].password_hash)) {
      res.status(401).json({ error: 'Mot de passe incorrect.' });
      return;
    }

    const validation = await validateSecondFactor(row, code);
    if (!validation.valid) {
      res.status(400).json({ error: 'Code de vérification invalide.' });
      return;
    }

    await pool.query(
      'UPDATE two_factor_auth SET is_enabled = FALSE, secret = ?, backup_codes = NULL WHERE user_id = ?',
      [encryptTwoFactorSecret(createTwoFactorSecret()), userId],
    );
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'DISABLE_2FA', 'user', ?, ?)`,
      [userId, userId, req.ip],
    );

    res.json({ message: 'Double authentification désactivée.' });
  } catch (error) {
    console.error('Erreur désactivation 2FA:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

export async function regenerateBackupCodes(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const code = typeof req.body.code === 'string' ? req.body.code : '';
  if (!code) {
    res.status(400).json({ error: 'Code de vérification requis.' });
    return;
  }

  try {
    const row = await getTwoFactorRow(userId);
    if (!row?.is_enabled) {
      res.status(409).json({ error: 'La double authentification n’est pas activée.' });
      return;
    }

    const secret = decryptTwoFactorSecret(row.secret);
    if (!await verifyTotpCode(secret, code.trim())) {
      res.status(400).json({ error: 'Code de vérification invalide.' });
      return;
    }

    const backupCodes = createBackupCodes();
    await pool.query(
      'UPDATE two_factor_auth SET backup_codes = ? WHERE user_id = ?',
      [JSON.stringify(backupCodes.hashedCodes), userId],
    );

    res.json({ backupCodes: backupCodes.plainCodes });
  } catch (error) {
    console.error('Erreur régénération codes 2FA:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

export async function verifyTwoFactorLogin(req: Request, res: Response): Promise<void> {
  const challengeToken = typeof req.body.challengeToken === 'string'
    ? req.body.challengeToken
    : '';
  const code = typeof req.body.code === 'string' ? req.body.code : '';

  if (!challengeToken || !code) {
    res.status(400).json({ error: 'Challenge et code de vérification requis.' });
    return;
  }

  let challenge: ReturnType<typeof verifyTwoFactorChallengeToken>;
  try {
    challenge = verifyTwoFactorChallengeToken(challengeToken);
  } catch {
    res.status(401).json({ error: 'Challenge de connexion invalide ou expiré.' });
    return;
  }

  try {
    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT id, email, first_name, last_name, role, created_at, password_updated_at, is_active
       FROM users WHERE id = ?`,
      [challenge.userId],
    );
    const user = users[0];
    const row = await getTwoFactorRow(challenge.userId);

    if (!user?.is_active || !row?.is_enabled) {
      res.status(401).json({ error: 'Challenge de connexion invalide ou expiré.' });
      return;
    }

    const validation = await validateSecondFactor(row, code);
    if (!validation.valid) {
      res.status(401).json({ error: 'Code de vérification invalide.' });
      return;
    }

    if (validation.backupCodeHash) {
      const usedCodeHash = validation.backupCodeHash;
      const [update] = await pool.query<ResultSetHeader>(
        `UPDATE two_factor_auth
         SET backup_codes = JSON_REMOVE(
           backup_codes,
           JSON_UNQUOTE(JSON_SEARCH(backup_codes, 'one', ?))
         )
         WHERE user_id = ? AND JSON_SEARCH(backup_codes, 'one', ?) IS NOT NULL`,
        [usedCodeHash, user.id, usedCodeHash],
      );

      if (update.affectedRows !== 1) {
        res.status(401).json({ error: 'Ce code de secours a déjà été utilisé.' });
        return;
      }
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, getRefreshExpiresAt()],
    );
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'LOGIN_2FA', 'user', ?, ?)`,
      [user.id, user.id, req.ip],
    );

    res.json({
      message: 'Connexion réussie.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at,
      },
      accessToken,
      refreshToken,
      passwordExpired: isPasswordExpired(user.password_updated_at),
      backupCodeUsed: Boolean(validation.backupCodeHash),
    });
  } catch (error) {
    console.error('Erreur vérification connexion 2FA:', error);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
