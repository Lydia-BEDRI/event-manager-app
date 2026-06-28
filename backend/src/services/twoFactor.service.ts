import crypto from 'crypto';
import { generateSecret, generateURI, verify } from 'otplib';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const BACKUP_CODE_COUNT = 8;

function getKey(purpose: string): Buffer {
  const material = process.env.TWO_FACTOR_ENCRYPTION_KEY
    || process.env.JWT_SECRET
    || 'eventmanager-development-two-factor-key';

  return crypto.createHash('sha256').update(`${purpose}:${material}`).digest();
}

export function createTwoFactorSecret(): string {
  return generateSecret();
}

export function createTwoFactorUri(email: string, secret: string): string {
  return generateURI({ issuer: 'EventManager', label: email, secret });
}

export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  const result = await verify({
    secret,
    token: code,
    epochTolerance: 30,
  });

  return result.valid;
}

export function encryptTwoFactorSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, getKey('totp'), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, encrypted].map((value) => value.toString('base64url')).join('.');
}

export function decryptTwoFactorSecret(payload: string): string {
  const [ivValue, authTagValue, encryptedValue] = payload.split('.');

  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error('Invalid encrypted two-factor secret.');
  }

  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getKey('totp'),
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function normalizeBackupCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function hashBackupCode(code: string): string {
  return crypto
    .createHmac('sha256', getKey('backup-code'))
    .update(normalizeBackupCode(code))
    .digest('hex');
}

export function createBackupCodes(): { plainCodes: string[]; hashedCodes: string[] } {
  const plainCodes = Array.from({ length: BACKUP_CODE_COUNT }, () => {
    const value = crypto.randomBytes(6).toString('hex').toUpperCase();
    return `${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
  });

  return {
    plainCodes,
    hashedCodes: plainCodes.map(hashBackupCode),
  };
}

export function parseBackupCodeHashes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value !== 'string' || !value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export function consumeBackupCode(
  code: string,
  storedHashes: string[],
): { valid: boolean; remainingHashes: string[] } {
  const candidateHash = hashBackupCode(code);
  const index = storedHashes.findIndex((storedHash) => {
    const left = Buffer.from(storedHash, 'hex');
    const right = Buffer.from(candidateHash, 'hex');
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  });

  if (index === -1) {
    return { valid: false, remainingHashes: storedHashes };
  }

  return {
    valid: true,
    remainingHashes: storedHashes.filter((_, storedIndex) => storedIndex !== index),
  };
}
