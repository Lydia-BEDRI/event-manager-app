import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/auth.service';

jest.mock('../../services/auth.service');

describe('AuthContext - two-factor login', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('ne crée aucune session avant la validation du second facteur', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      message: 'Code requis.',
      requiresTwoFactor: true,
      challengeToken: 'challenge-token',
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult: Awaited<ReturnType<typeof result.current.login>> | undefined;
    await act(async () => {
      loginResult = await result.current.login({
        email: 'user@example.com',
        password: 'StrongPassword1!',
      });
    });

    expect(loginResult).toEqual({
      requiresTwoFactor: true,
      challengeToken: 'challenge-token',
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('stocke la session uniquement après un code 2FA valide', async () => {
    const user = {
      id: 42,
      email: 'user@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'PARTICIPANT',
    };
    (authService.verifyTwoFactorLogin as jest.Mock).mockResolvedValue({
      message: 'Connexion réussie.',
      user,
      accessToken: 'access-token',
      passwordExpired: false,
      backupCodeUsed: false,
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.verifyTwoFactorLogin('challenge-token', '123456');
    });

    expect(authService.verifyTwoFactorLogin).toHaveBeenCalledWith('challenge-token', '123456');
    expect(result.current.user).toEqual(user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe('access-token');
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
