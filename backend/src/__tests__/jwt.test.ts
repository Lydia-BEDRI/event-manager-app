import {
  generateAccessToken,
  generateRefreshToken,
  generateTwoFactorChallengeToken,
  verifyToken,
  verifyTwoFactorChallengeToken,
} from '../utils/jwt';
import jwt from 'jsonwebtoken';

describe('JWT utils', () => {
  const payload = { userId: 1, role: 'PARTICIPANT' };
  const secret = process.env.JWT_SECRET || 'dev-secret-key';

  it('génère un access token valide', () => {
    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('génère un refresh token valide', () => {
    const token = generateRefreshToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('vérifie et décode un token', () => {
    const token = generateAccessToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it('rejette un token invalide', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow();
  });

  it('contient les champs attendus', () => {
    const token = generateAccessToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('role');
    expect(decoded).toHaveProperty('iat');
    expect(decoded).toHaveProperty('exp');
    expect(decoded).not.toHaveProperty('email');
    expect(decoded).not.toHaveProperty('password');
  });

  it('génère un access token de 15 minutes', () => {
    const token = generateAccessToken(payload);
    const decoded = jwt.decode(token) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(15 * 60);
  });

  it('génère un refresh token de 7 jours', () => {
    const token = generateRefreshToken(payload);
    const decoded = jwt.decode(token) as { iat: number; exp: number };
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
  });

  it('rejette un token modifié', () => {
    const token = generateAccessToken(payload);
    const parts = token.split('.');
    const modifiedPayload = Buffer.from(JSON.stringify({
      userId: 1,
      role: 'ADMIN',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    })).toString('base64url');

    expect(() => verifyToken([parts[0], modifiedPayload, parts[2]].join('.'))).toThrow();
  });

  it('rejette un token expiré', () => {
    const token = jwt.sign(payload, secret, {
      algorithm: 'HS256',
      expiresIn: -1,
    });

    expect(() => verifyToken(token)).toThrow();
  });

  it('rejette un algorithme incorrect', () => {
    const token = jwt.sign(payload, secret, {
      algorithm: 'HS384',
      expiresIn: '15m',
    });

    expect(() => verifyToken(token)).toThrow();
  });

  it('rejette une signature incorrecte', () => {
    const token = jwt.sign(payload, 'wrong-secret', {
      algorithm: 'HS256',
      expiresIn: '15m',
    });

    expect(() => verifyToken(token)).toThrow();
  });

  it('accepte un challenge 2FA uniquement avec le vérificateur dédié', () => {
    const challenge = generateTwoFactorChallengeToken(payload);

    expect(verifyTwoFactorChallengeToken(challenge)).toEqual(expect.objectContaining(payload));
    expect(() => verifyToken(challenge)).toThrow('Invalid access token purpose.');
  });
});
