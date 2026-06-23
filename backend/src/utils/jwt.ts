import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN_DAYS = 7;

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload }, JWT_SECRET, { expiresIn: `${REFRESH_EXPIRES_IN_DAYS}d` } as SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function getRefreshExpiresAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_EXPIRES_IN_DAYS);
  return date;
}
