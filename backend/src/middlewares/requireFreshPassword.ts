import { Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from '../config/database';
import { AuthenticatedRequest } from './authenticate';
import { isPasswordExpired } from '../utils/password';

interface PasswordFreshnessRow extends RowDataPacket {
  id: number;
  is_active: boolean;
  password_updated_at: Date;
}

export async function requireFreshPassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Non authentifié.' });
    return;
  }

  try {
    const [rows] = await pool.query<PasswordFreshnessRow[]>(
      'SELECT id, is_active, password_updated_at FROM users WHERE id = ?',
      [req.user.userId],
    );

    const user = rows[0];
    if (!user || !user.is_active) {
      res.status(403).json({
        code: 'ACCOUNT_INACTIVE',
        error: 'Compte désactivé ou introuvable.',
      });
      return;
    }

    if (isPasswordExpired(user.password_updated_at)) {
      res.status(403).json({
        code: 'PASSWORD_EXPIRED',
        error: 'Votre mot de passe a expiré. Veuillez le modifier.',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erreur vérification fraîcheur mot de passe:', error);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}
