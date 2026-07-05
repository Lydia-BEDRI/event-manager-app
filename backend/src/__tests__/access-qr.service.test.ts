process.env.QR_CODE_PRIVATE_KEY = 'test-access-qr-private-key';

import jwt from 'jsonwebtoken';
import {
  generateSignedAccessQr,
  isReusableAccessQrToken,
  verifySignedAccessQr,
} from '../services/access-qr.service';

describe('Access QR service', () => {
  it('genere un QR signe pour une participation approuvee', async () => {
    const generated = await generateSignedAccessQr({
      id: 12,
      user_id: 3,
      event_id: 8,
    });

    expect(generated.token.split('.')).toHaveLength(3);
    expect(generated.dataUrl).toMatch(/^data:image\/png;base64,/);

    const payload = verifySignedAccessQr(generated.token);
    expect(payload).toEqual(expect.objectContaining({
      purpose: 'event-access',
      participationId: 12,
      userId: 3,
      eventId: 8,
    }));
    expect(payload.jti).toEqual(expect.any(String));
  });

  it('refuse un token avec une signature invalide', () => {
    const invalidToken = jwt.sign(
      {
        purpose: 'event-access',
        participationId: 12,
        userId: 3,
        eventId: 8,
        jti: 'test',
      },
      'another-private-key',
    );

    expect(() => verifySignedAccessQr(invalidToken)).toThrow();
  });

  it('detecte si un QR stocke correspond a la participation', async () => {
    const generated = await generateSignedAccessQr({
      id: 12,
      user_id: 3,
      event_id: 8,
    });

    expect(isReusableAccessQrToken(generated.token, {
      id: 12,
      user_id: 3,
      event_id: 8,
    })).toBe(true);
    expect(isReusableAccessQrToken(generated.token, {
      id: 13,
      user_id: 3,
      event_id: 8,
    })).toBe(false);
  });
});
