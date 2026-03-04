/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/auth.service';
import React from 'react';

jest.mock('../../services/auth.service');

describe('AuthContext - updateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('updateUser Function', () => {
    it('devrait mettre à jour les informations de l\'utilisateur', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'PARTICIPANT',
        createdAt: '2024-01-15T10:30:00.000Z',
      };

      (authService.getMe as jest.Mock).mockResolvedValue({ user: mockUser });
      localStorage.setItem('accessToken', 'mock-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);

      const updatedUser = {
        ...mockUser,
        firstName: 'Pierre',
        lastName: 'Martin',
      };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(result.current.user?.firstName).toBe('Pierre');
      expect(result.current.user?.lastName).toBe('Martin');
    });

    it('devrait mettre à jour seulement le prénom', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'PARTICIPANT',
      };

      (authService.getMe as jest.Mock).mockResolvedValue({ user: mockUser });
      localStorage.setItem('accessToken', 'mock-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedUser = {
        ...mockUser,
        firstName: 'Marie',
      };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user?.firstName).toBe('Marie');
      expect(result.current.user?.lastName).toBe('Dupont');
      expect(result.current.user?.email).toBe('test@example.com');
    });

    it('devrait mettre à jour seulement le nom', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'PARTICIPANT',
      };

      (authService.getMe as jest.Mock).mockResolvedValue({ user: mockUser });
      localStorage.setItem('accessToken', 'mock-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedUser = {
        ...mockUser,
        lastName: 'Bernard',
      };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user?.firstName).toBe('Jean');
      expect(result.current.user?.lastName).toBe('Bernard');
    });

    it('devrait conserver l\'état d\'authentification après la mise à jour', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'PARTICIPANT',
      };

      (authService.getMe as jest.Mock).mockResolvedValue({ user: mockUser });
      localStorage.setItem('accessToken', 'mock-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);

      const updatedUser = {
        ...mockUser,
        firstName: 'Pierre',
      };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.accessToken).toBe('mock-token');
    });

    it('devrait mettre à jour createdAt si fourni', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'PARTICIPANT',
        createdAt: '2024-01-15T10:30:00.000Z',
      };

      (authService.getMe as jest.Mock).mockResolvedValue({ user: mockUser });
      localStorage.setItem('accessToken', 'mock-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedUser = {
        ...mockUser,
        firstName: 'Pierre',
        createdAt: '2024-02-20T15:45:00.000Z',
      };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user?.createdAt).toBe('2024-02-20T15:45:00.000Z');
    });

    it('devrait gérer les mises à jour avec avatarUrl', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'PARTICIPANT',
      };

      (authService.getMe as jest.Mock).mockResolvedValue({ user: mockUser });
      localStorage.setItem('accessToken', 'mock-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedUser = {
        ...mockUser,
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user?.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('devrait mettre à jour le rôle si fourni', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'PARTICIPANT',
      };

      (authService.getMe as jest.Mock).mockResolvedValue({ user: mockUser });
      localStorage.setItem('accessToken', 'mock-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedUser = {
        ...mockUser,
        role: 'ADMIN',
      };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user?.role).toBe('ADMIN');
    });

    it('devrait permettre plusieurs mises à jour successives', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'PARTICIPANT',
      };

      (authService.getMe as jest.Mock).mockResolvedValue({ user: mockUser });
      localStorage.setItem('accessToken', 'mock-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateUser({ ...mockUser, firstName: 'Pierre' });
      });

      expect(result.current.user?.firstName).toBe('Pierre');

      act(() => {
        result.current.updateUser({ ...mockUser, firstName: 'Pierre', lastName: 'Martin' });
      });

      expect(result.current.user?.firstName).toBe('Pierre');
      expect(result.current.user?.lastName).toBe('Martin');

      act(() => {
        result.current.updateUser({
          ...mockUser,
          firstName: 'Alice',
          lastName: 'Bernard',
        });
      });

      expect(result.current.user?.firstName).toBe('Alice');
      expect(result.current.user?.lastName).toBe('Bernard');
    });

    it('devrait remplacer complètement l\'objet user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'PARTICIPANT',
        avatarUrl: 'old-avatar.jpg',
      };

      (authService.getMe as jest.Mock).mockResolvedValue({ user: mockUser });
      localStorage.setItem('accessToken', 'mock-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const completelyNewUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Marie',
        lastName: 'Leclerc',
        role: 'ADMIN',
        avatarUrl: 'new-avatar.jpg',
        createdAt: '2024-03-01T00:00:00.000Z',
      };

      act(() => {
        result.current.updateUser(completelyNewUser);
      });

      expect(result.current.user).toEqual(completelyNewUser);
    });
  });

  describe('updateUser Integration', () => {
    it('devrait fonctionner après l\'inscription', async () => {
      const mockRegisterResponse = {
        message: 'Inscription réussie.',
        user: {
          id: 1,
          email: 'new@example.com',
          firstName: 'Nouveau',
          lastName: 'Utilisateur',
          role: 'PARTICIPANT',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockRegisterResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register({
          email: 'new@example.com',
          password: 'password123',
          firstName: 'Nouveau',
          lastName: 'Utilisateur',
        });
      });

      expect(result.current.user?.firstName).toBe('Nouveau');

      act(() => {
        result.current.updateUser({
          ...mockRegisterResponse.user,
          firstName: 'Modifié',
        });
      });

      expect(result.current.user?.firstName).toBe('Modifié');
    });

    it('devrait fonctionner après la connexion', async () => {
      const mockLoginResponse = {
        message: 'Connexion réussie.',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Jean',
          lastName: 'Dupont',
          role: 'PARTICIPANT',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(result.current.user?.firstName).toBe('Jean');

      act(() => {
        result.current.updateUser({
          ...mockLoginResponse.user,
          firstName: 'Pierre',
          lastName: 'Martin',
        });
      });

      expect(result.current.user?.firstName).toBe('Pierre');
      expect(result.current.user?.lastName).toBe('Martin');
    });

    it('ne devrait pas persister les modifications dans localStorage', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'PARTICIPANT',
      };

      (authService.getMe as jest.Mock).mockResolvedValue({ user: mockUser });
      localStorage.setItem('accessToken', 'mock-token');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedUser = {
        ...mockUser,
        firstName: 'Pierre',
      };

      act(() => {
        result.current.updateUser(updatedUser);
      });

      expect(result.current.user?.firstName).toBe('Pierre');
      
      // localStorage ne devrait contenir que les tokens, pas les infos utilisateur
      expect(localStorage.getItem('accessToken')).toBe('mock-token');
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});
