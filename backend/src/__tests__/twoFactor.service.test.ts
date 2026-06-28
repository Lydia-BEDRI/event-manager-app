import { generate } from 'otplib';
import {
  consumeBackupCode,
  createBackupCodes,
  createTwoFactorSecret,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  hashBackupCode,
  normalizeBackupCode,
  parseBackupCodeHashes,
  verifyTotpCode,
} from '../services/twoFactor.service';

describe('Two-factor service', () => {
  beforeAll(() => {
    process.env.TWO_FACTOR_ENCRYPTION_KEY = 'test-two-factor-encryption-key';
  });

  afterAll(() => {
    delete process.env.TWO_FACTOR_ENCRYPTION_KEY;
  });

  it('chiffre et déchiffre un secret TOTP sans stocker sa valeur brute', () => {
    const secret = createTwoFactorSecret();
    const encrypted = encryptTwoFactorSecret(secret);

    expect(encrypted).not.toContain(secret);
    expect(encrypted.split('.')).toHaveLength(3);
    expect(decryptTwoFactorSecret(encrypted)).toBe(secret);
  });

  it('rejette un secret chiffré altéré', () => {
    const encrypted = encryptTwoFactorSecret(createTwoFactorSecret());
    const tampered = `${encrypted.slice(0, -1)}${encrypted.endsWith('A') ? 'B' : 'A'}`;

    expect(() => decryptTwoFactorSecret(tampered)).toThrow();
  });

  it('valide un code TOTP généré avec le même secret', async () => {
    const secret = createTwoFactorSecret();
    const token = await generate({ secret });

    await expect(verifyTotpCode(secret, token)).resolves.toBe(true);
    await expect(verifyTotpCode(secret, '000000')).resolves.toBe(false);
    await expect(verifyTotpCode(secret, 'not-a-code')).resolves.toBe(false);
  });

  it('génère huit codes de secours uniques et ne conserve que leurs empreintes', () => {
    const result = createBackupCodes();

    expect(result.plainCodes).toHaveLength(8);
    expect(new Set(result.plainCodes).size).toBe(8);
    expect(result.hashedCodes).toHaveLength(8);
    result.plainCodes.forEach((code, index) => {
      expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
      expect(result.hashedCodes[index]).toBe(hashBackupCode(code));
      expect(result.hashedCodes[index]).not.toContain(normalizeBackupCode(code));
    });
  });

  it('consomme un code de secours une seule fois', () => {
    const codes = ['ABCD-EF12-3456', '9876-ABCD-EF12'];
    const hashes = codes.map(hashBackupCode);
    const firstUse = consumeBackupCode('abcd ef12 3456', hashes);

    expect(firstUse.valid).toBe(true);
    expect(firstUse.remainingHashes).toEqual([hashes[1]]);
    expect(consumeBackupCode(codes[0], firstUse.remainingHashes).valid).toBe(false);
  });

  it('lit les codes de secours depuis une colonne JSON MySQL', () => {
    const hashes = ['hash-one', 'hash-two'];

    expect(parseBackupCodeHashes(JSON.stringify(hashes))).toEqual(hashes);
    expect(parseBackupCodeHashes(hashes)).toEqual(hashes);
    expect(parseBackupCodeHashes('invalid-json')).toEqual([]);
  });
});
