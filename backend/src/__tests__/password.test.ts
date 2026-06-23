import { isPasswordStrong, isPasswordExpired } from '../utils/password';

describe('Password utils', () => {

  describe('isPasswordStrong', () => {
    it('rejette un mot de passe trop court', () => {
      const result = isPasswordStrong('Short1!a');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('12 caractères');
    });

    it('rejette un mot de passe sans majuscule', () => {
      const result = isPasswordStrong('monmotdepasse1!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('majuscule');
    });

    it('rejette un mot de passe sans minuscule', () => {
      const result = isPasswordStrong('MONMOTDEPASSE1!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('minuscule');
    });

    it('rejette un mot de passe sans chiffre', () => {
      const result = isPasswordStrong('MonMotDePasse!!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('chiffre');
    });

    it('rejette un mot de passe sans caractère spécial', () => {
      const result = isPasswordStrong('MonMotDePasse12');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('spécial');
    });

    it('accepte un mot de passe conforme', () => {
      const result = isPasswordStrong('MonSuperPass1!');
      expect(result.valid).toBe(true);
      expect(result.message).toBe('');
    });
  });

  describe('isPasswordExpired', () => {
    it('retourne false pour un mot de passe récent', () => {
      const recent = new Date();
      expect(isPasswordExpired(recent)).toBe(false);
    });

    it('retourne true pour un mot de passe de plus de 60 jours', () => {
      const old = new Date();
      old.setDate(old.getDate() - 61);
      expect(isPasswordExpired(old)).toBe(true);
    });

    it('retourne false pour un mot de passe de 59 jours', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 59);
      expect(isPasswordExpired(recent)).toBe(false);
    });
  });
});
