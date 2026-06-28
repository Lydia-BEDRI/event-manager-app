import { api } from './api';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
  passwordExpired?: boolean;
  backupCodeUsed?: boolean;
}

export interface TwoFactorChallengeResponse {
  message: string;
  requiresTwoFactor: true;
  challengeToken: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  currentPassword?: string;
  newPassword?: string;
}

export const authService = {
  register: (data: RegisterData) =>
    api.post<AuthResponse>('/auth/register', data as unknown as Record<string, unknown>),

  login: (data: LoginData) =>
    api.post<AuthResponse | TwoFactorChallengeResponse>(
      '/auth/login',
      data as unknown as Record<string, unknown>,
    ),

  verifyTwoFactorLogin: (challengeToken: string, code: string) =>
    api.post<AuthResponse>('/auth/2fa/login/verify', { challengeToken, code }),

  logout: (refreshToken: string, accessToken: string) =>
    api.post<{ message: string }>('/auth/logout', { refreshToken }, accessToken),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }),

  getMe: (token: string) =>
    api.get<{ user: User }>('/auth/me', token),

  updateRole: (userId: number, role: string, token: string) =>
    api.patch<{ message: string }>('/auth/role', { userId, role }, token),

  updateProfile: (data: UpdateProfileData, token: string) =>
    api.patch<{ message: string; user: User }>('/auth/profile', data, token),

  getTwoFactorStatus: (token: string) =>
    api.get<{ enabled: boolean; backupCodesRemaining: number }>('/auth/2fa/status', token),

  setupTwoFactor: (token: string) =>
    api.post<{ secret: string; qrCodeDataUrl: string }>('/auth/2fa/setup', {}, token),

  enableTwoFactor: (code: string, token: string) =>
    api.post<{ message: string; backupCodes: string[] }>('/auth/2fa/enable', { code }, token),

  disableTwoFactor: (password: string, code: string, token: string) =>
    api.post<{ message: string }>('/auth/2fa/disable', { password, code }, token),

  regenerateBackupCodes: (code: string, token: string) =>
    api.post<{ backupCodes: string[] }>('/auth/2fa/backup-codes', { code }, token),
};
