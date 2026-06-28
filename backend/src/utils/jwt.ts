import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN_DAYS = 7;
const TWO_FACTOR_CHALLENGE_EXPIRES_IN = '5m';

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

interface TwoFactorChallengePayload extends TokenPayload {
  purpose: 'two-factor-challenge';
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload }, JWT_SECRET, { expiresIn: `${REFRESH_EXPIRES_IN_DAYS}d` } as SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & { purpose?: string };

  if (decoded.purpose) {
    throw new Error('Invalid access token purpose.');
  }

  return decoded;
}

export function generateTwoFactorChallengeToken(payload: TokenPayload): string {
  return jwt.sign(
    { ...payload, purpose: 'two-factor-challenge' },
    JWT_SECRET,
    { expiresIn: TWO_FACTOR_CHALLENGE_EXPIRES_IN } as SignOptions,
  );
}

export function verifyTwoFactorChallengeToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as TwoFactorChallengePayload;

  if (decoded.purpose !== 'two-factor-challenge') {
    throw new Error('Invalid two-factor challenge.');
  }

  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };
}

export function getRefreshExpiresAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_EXPIRES_IN_DAYS);
  return date;
}
