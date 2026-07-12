import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/database';
import { generateAccessToken, generateRefreshToken, generateTwoFactorChallengeToken, getRefreshExpiresAt, verifyToken } from '../utils/jwt';
import { isPasswordExpired, isPasswordStrong } from '../utils/password';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sendPasswordResetEmail } from '../services/email.service';
import { clearRefreshTokenCookie, getRefreshTokenFromRequest, setRefreshTokenCookie } from '../utils/authCookies';

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;
const PASSWORD_RESET_EXPIRY_MINUTES = 60;

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/auth/register
export async function register(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password, firstName, lastName } = req.body;

  try {
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      res.status(409).json({ error: 'Un compte avec cet email existe déjà.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, password_updated_at)
       VALUES (?, ?, ?, ?, 'PARTICIPANT', TRUE, NOW())`,
      [email, passwordHash, firstName, lastName]
    );

    const userId = result.insertId;

    const tokenPayload = { userId, role: 'PARTICIPANT' };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, refreshToken, getRefreshExpiresAt()]
    );
    setRefreshTokenCookie(res, refreshToken);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'REGISTER', 'user', ?, ?)`,
      [userId, userId, req.ip]
    );

    const [newUser] = await pool.query<RowDataPacket[]>(
      'SELECT created_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      message: 'Inscription réussie.',
      user: { 
        id: userId, 
        email, 
        firstName, 
        lastName, 
        role: 'PARTICIPANT',
        createdAt: newUser[0].created_at,
      },
      accessToken,
    });
  } catch (err) {
    console.error('Erreur inscription:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      return;
    }

    const user = rows[0];

    if (!user.is_active) {
      res.status(403).json({ error: 'Compte désactivé. Contactez un administrateur.' });
      return;
    }

    // Vérifier le verrouillage
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
      res.status(423).json({
        error: `Compte verrouillé. Réessayez dans ${remaining} minute(s).`,
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      const attempts = user.failed_login_attempts + 1;
      const lockUntil = attempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
        : null;

      await pool.query(
        'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
        [attempts, lockUntil, user.id]
      );

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        res.status(423).json({
          error: `Trop de tentatives. Compte verrouillé pour ${LOCK_DURATION_MINUTES} minutes.`,
        });
        return;
      }

      res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
      return;
    }

    // Reset failed attempts
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      [user.id]
    );

    // Vérifier expiration du mot de passe (60 jours)
    const passwordExpired = isPasswordExpired(user.password_updated_at);

    const tokenPayload = { userId: user.id, role: user.role };
    const [twoFactorRows] = await pool.query<RowDataPacket[]>(
      'SELECT is_enabled FROM two_factor_auth WHERE user_id = ?',
      [user.id],
    );

    if (twoFactorRows[0]?.is_enabled) {
      res.json({
        message: 'Code de double authentification requis.',
        requiresTwoFactor: true,
        challengeToken: generateTwoFactorChallengeToken(tokenPayload),
      });
      return;
    }

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, getRefreshExpiresAt()]
    );
    setRefreshTokenCookie(res, refreshToken);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'LOGIN', 'user', ?, ?)`,
      [user.id, user.id, req.ip]
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
      passwordExpired,
    });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}

// POST /api/auth/refresh
export async function refreshAccessToken(req: Request, res: Response): Promise<void> {
  const refreshToken = getRefreshTokenFromRequest(req) || req.body.refreshToken;

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token requis.' });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM refresh_tokens WHERE token = ? AND revoked = FALSE AND expires_at > NOW()',
      [refreshToken]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'Refresh token invalide ou expiré.' });
      return;
    }

    const decoded = verifyToken(refreshToken);
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      role: decoded.role,
    });

    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ error: 'Refresh token invalide.' });
  }
}

// POST /api/auth/logout
export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const refreshToken = getRefreshTokenFromRequest(req) || req.body.refreshToken;

  try {
    if (refreshToken) {
      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token = ?',
        [refreshToken]
      );
    }
    clearRefreshTokenCookie(res);

    if (req.user) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
         VALUES (?, 'LOGOUT', 'user', ?, ?)`,
        [req.user.userId, req.user.userId, req.ip]
      );
    }

    res.json({ message: 'Déconnexion réussie.' });
  } catch (err) {
    console.error('Erreur logout:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email } = req.body;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    // Toujours répondre 200 pour ne pas révéler si l'email existe
    if (rows.length === 0) {
      res.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
      return;
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

    // Invalider les anciens tokens
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = ? AND used = FALSE',
      [user.id]
    );

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl = new URL('/reset-password', process.env.FRONTEND_URL || 'http://localhost:3000');
    resetUrl.searchParams.set('token', token);
    await sendPasswordResetEmail({
      to: email,
      resetLink: resetUrl.toString(),
      expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
    });

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'FORGOT_PASSWORD', 'user', ?, ?)`,
      [user.id, user.id, req.ip]
    );

    res.json({ message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.' });
  } catch (err) {
    console.error('Erreur forgot-password:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}

// POST /api/auth/reset-password
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { token, password } = req.body;

  try {
    const tokenHash = hashResetToken(token);
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [tokenHash]
    );

    if (rows.length === 0) {
      res.status(400).json({ error: 'Token invalide ou expiré.' });
      return;
    }

    const resetToken = rows[0];
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.query(
      'UPDATE users SET password_hash = ?, password_updated_at = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      [passwordHash, resetToken.user_id]
    );

    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
      [resetToken.id]
    );

    // Révoquer tous les refresh tokens
    await pool.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?',
      [resetToken.user_id]
    );
    clearRefreshTokenCookie(res);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'RESET_PASSWORD', 'user', ?, ?)`,
      [resetToken.user_id, resetToken.user_id, req.ip]
    );

    res.json({ message: 'Mot de passe réinitialisé avec succès. Veuillez vous reconnecter.' });
  } catch (err) {
    console.error('Erreur reset-password:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}

// GET /api/auth/me
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Non authentifié.' });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, email, first_name, last_name, role, avatar_url, is_active, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Utilisateur introuvable.' });
      return;
    }

    const user = rows[0];
    if (!user.is_active) {
      res.status(403).json({ code: 'ACCOUNT_INACTIVE', error: 'Compte désactivé.' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Erreur get me:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}

// PATCH /api/auth/role (admin only)
export async function updateUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { userId, role } = req.body;

  const validRoles = ['ADMIN', 'PARTICIPANT', 'SCANNER'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: `Rôle invalide. Valeurs acceptées : ${validRoles.join(', ')}` });
    return;
  }

  if (!userId) {
    res.status(400).json({ error: 'userId requis.' });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Utilisateur introuvable.' });
      return;
    }

    const oldRole = rows[0].role;

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
       VALUES (?, 'UPDATE_ROLE', 'user', ?, ?, ?, ?)`,
      [req.user!.userId, userId, JSON.stringify({ role: oldRole }), JSON.stringify({ role }), req.ip]
    );

    res.json({ message: `Rôle mis à jour : ${role}` });
  } catch (err) {
    console.error('Erreur update role:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}

// PATCH /api/auth/profile
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Non authentifié.' });
    return;
  }

  const { firstName, lastName, currentPassword, newPassword } = req.body;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Utilisateur introuvable.' });
      return;
    }

    const user = rows[0];
    const oldValues: any = {};
    const newValues: any = {};

    // Mise à jour du prénom
    if (firstName && firstName !== user.first_name) {
      oldValues.firstName = user.first_name;
      newValues.firstName = firstName;
      await pool.query('UPDATE users SET first_name = ? WHERE id = ?', [firstName, req.user.userId]);
    }

    // Mise à jour du nom
    if (lastName && lastName !== user.last_name) {
      oldValues.lastName = user.last_name;
      newValues.lastName = lastName;
      await pool.query('UPDATE users SET last_name = ? WHERE id = ?', [lastName, req.user.userId]);
    }

    // Mise à jour du mot de passe
    if (currentPassword && newPassword) {
      const passwordValidation = isPasswordStrong(newPassword);
      if (!passwordValidation.valid) {
        res.status(400).json({ error: passwordValidation.message });
        return;
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!passwordMatch) {
        res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
        return;
      }

      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await pool.query(
        'UPDATE users SET password_hash = ?, password_updated_at = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
        [passwordHash, req.user.userId]
      );

      oldValues.password = '***';
      newValues.password = '***';

      // Révoquer tous les refresh tokens sauf celui en cours
      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = ?',
        [req.user.userId]
      );
    }

    // Log de l'audit
    if (Object.keys(newValues).length > 0) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
         VALUES (?, 'UPDATE_PROFILE', 'user', ?, ?, ?, ?)`,
        [req.user.userId, req.user.userId, JSON.stringify(oldValues), JSON.stringify(newValues), req.ip]
      );
    }

    // Récupérer les données mises à jour
    const [updatedUser] = await pool.query<RowDataPacket[]>(
      'SELECT id, email, first_name, last_name, role, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    res.json({
      message: 'Profil mis à jour avec succès.',
      user: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        firstName: updatedUser[0].first_name,
        lastName: updatedUser[0].last_name,
        role: updatedUser[0].role,
        avatarUrl: updatedUser[0].avatar_url,
        createdAt: updatedUser[0].created_at,
      },
    });
  } catch (err) {
    console.error('Erreur update profile:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue.' });
  }
}
