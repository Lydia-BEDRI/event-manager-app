import crypto from 'crypto';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import QRCode from 'qrcode';

const ACCESS_QR_PURPOSE = 'event-access';

export interface AccessQrPayload {
  purpose: typeof ACCESS_QR_PURPOSE;
  participationId: number;
  userId: number;
  eventId: number;
  jti: string;
}

export interface AccessQrSubject {
  id: number;
  user_id: number;
  event_id: number;
}

export interface GeneratedAccessQr {
  token: string;
  dataUrl: string;
  payload: AccessQrPayload;
}

function getQrPrivateKey(): Secret {
  return (
    process.env.QR_CODE_PRIVATE_KEY ||
    process.env.ACCESS_QR_PRIVATE_KEY ||
    process.env.JWT_SECRET ||
    'dev-access-qr-private-key'
  );
}

function getSignOptions(): SignOptions {
  const options: SignOptions = { algorithm: 'HS256' };

  if (process.env.QR_CODE_TOKEN_TTL) {
    options.expiresIn = process.env.QR_CODE_TOKEN_TTL as SignOptions['expiresIn'];
  }

  return options;
}

export async function generateSignedAccessQr(subject: AccessQrSubject): Promise<GeneratedAccessQr> {
  const payload: AccessQrPayload = {
    purpose: ACCESS_QR_PURPOSE,
    participationId: Number(subject.id),
    userId: Number(subject.user_id),
    eventId: Number(subject.event_id),
    jti: crypto.randomBytes(16).toString('hex'),
  };

  const token = jwt.sign(payload, getQrPrivateKey(), getSignOptions());
  const dataUrl = await QRCode.toDataURL(token, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
  });

  return { token, dataUrl, payload };
}

export async function renderAccessQrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
  });
}

export function verifySignedAccessQr(token: string): AccessQrPayload {
  const decoded = jwt.verify(token, getQrPrivateKey(), {
    algorithms: ['HS256'],
  }) as Partial<AccessQrPayload>;
  const participationId = decoded.participationId;
  const userId = decoded.userId;
  const eventId = decoded.eventId;
  const jti = decoded.jti;

  if (
    decoded.purpose !== ACCESS_QR_PURPOSE ||
    typeof participationId !== 'number' ||
    !Number.isInteger(participationId) ||
    typeof userId !== 'number' ||
    !Number.isInteger(userId) ||
    typeof eventId !== 'number' ||
    !Number.isInteger(eventId) ||
    typeof jti !== 'string' ||
    jti.length === 0
  ) {
    throw new Error('Invalid access QR payload.');
  }

  return {
    purpose: ACCESS_QR_PURPOSE,
    participationId,
    userId,
    eventId,
    jti,
  };
}

export function isReusableAccessQrToken(token: string | null, subject: AccessQrSubject): boolean {
  if (!token) {
    return false;
  }

  try {
    const payload = verifySignedAccessQr(token);
    return (
      payload.participationId === Number(subject.id) &&
      payload.userId === Number(subject.user_id) &&
      payload.eventId === Number(subject.event_id)
    );
  } catch {
    return false;
  }
}
