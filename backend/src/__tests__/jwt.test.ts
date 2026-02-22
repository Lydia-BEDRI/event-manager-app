import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';

describe('JWT utils', () => {
  const payload = { userId: 1, email: 'test@test.com', role: 'PARTICIPANT' };

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
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('rejette un token invalide', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow();
  });

  it('contient les champs attendus', () => {
    const token = generateAccessToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('email');
    expect(decoded).toHaveProperty('role');
    expect(decoded).toHaveProperty('iat');
    expect(decoded).toHaveProperty('exp');
  });
});
