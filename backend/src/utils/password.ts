const PASSWORD_MIN_LENGTH = 12;

export function isPasswordStrong(password: string): { valid: boolean; message: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.` };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une lettre minuscule.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une lettre majuscule.' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial.' };
  }
  return { valid: true, message: '' };
}

export function isPasswordExpired(passwordUpdatedAt: Date, maxDays: number = 60): boolean {
  const now = new Date();
  const diff = now.getTime() - new Date(passwordUpdatedAt).getTime();
  const daysDiff = diff / (1000 * 60 * 60 * 24);
  return daysDiff >= maxDays;
}
