/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { authService, UpdateProfileData } from '../auth.service';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Auth Service - Profile Update', () => {
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('devrait mettre à jour le prénom et nom avec succès', async () => {
      const updateData: UpdateProfileData = {
        firstName: 'Jean',
        lastName: 'Dupont',
      };

      const mockResponse = {
        message: 'Profil mis à jour avec succès.',
        user: {
          id: 1,
          email: 'jean.dupont@example.com',
          firstName: 'Jean',
          lastName: 'Dupont',
          role: 'PARTICIPANT',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      };

      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.updateProfile(updateData, mockAccessToken);

      expect(api.patch).toHaveBeenCalledWith('/auth/profile', updateData, mockAccessToken);
      expect(result).toEqual(mockResponse);
      expect(result.user.firstName).toBe('Jean');
      expect(result.user.lastName).toBe('Dupont');
    });

    it('devrait mettre à jour seulement le prénom', async () => {
      const updateData: UpdateProfileData = {
        firstName: 'Marie',
      };

      const mockResponse = {
        message: 'Profil mis à jour avec succès.',
        user: {
          id: 1,
          email: 'marie@example.com',
          firstName: 'Marie',
          lastName: 'Martin',
          role: 'PARTICIPANT',
        },
      };

      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.updateProfile(updateData, mockAccessToken);

      expect(api.patch).toHaveBeenCalledWith('/auth/profile', updateData, mockAccessToken);
      expect(result.user.firstName).toBe('Marie');
    });

    it('devrait mettre à jour seulement le nom', async () => {
      const updateData: UpdateProfileData = {
        lastName: 'Durand',
      };

      const mockResponse = {
        message: 'Profil mis à jour avec succès.',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Pierre',
          lastName: 'Durand',
          role: 'ADMIN',
        },
      };

      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.updateProfile(updateData, mockAccessToken);

      expect(result.user.lastName).toBe('Durand');
    });

    it('devrait changer le mot de passe avec succès', async () => {
      const updateData: UpdateProfileData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      const mockResponse = {
        message: 'Profil mis à jour avec succès. Vous devez vous reconnecter.',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'PARTICIPANT',
        },
      };

      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.updateProfile(updateData, mockAccessToken);

      expect(api.patch).toHaveBeenCalledWith('/auth/profile', updateData, mockAccessToken);
      expect(result.message).toContain('reconnecter');
    });

    it('devrait mettre à jour les informations et changer le mot de passe simultanément', async () => {
      const updateData: UpdateProfileData = {
        firstName: 'Alice',
        lastName: 'Bernard',
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      const mockResponse = {
        message: 'Profil mis à jour avec succès. Vous devez vous reconnecter.',
        user: {
          id: 1,
          email: 'alice.bernard@example.com',
          firstName: 'Alice',
          lastName: 'Bernard',
          role: 'PARTICIPANT',
        },
      };

      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.updateProfile(updateData, mockAccessToken);

      expect(api.patch).toHaveBeenCalledWith('/auth/profile', updateData, mockAccessToken);
      expect(result.user.firstName).toBe('Alice');
      expect(result.user.lastName).toBe('Bernard');
      expect(result.message).toContain('reconnecter');
    });

    it('devrait gérer les erreurs de validation', async () => {
      const updateData: UpdateProfileData = {
        newPassword: 'short',
      };

      const mockError = new Error('Le mot de passe doit contenir au moins 8 caractères.');

      (api.patch as jest.Mock).mockRejectedValue(mockError);

      await expect(authService.updateProfile(updateData, mockAccessToken)).rejects.toThrow(
        'Le mot de passe doit contenir au moins 8 caractères.'
      );

      expect(api.patch).toHaveBeenCalledWith('/auth/profile', updateData, mockAccessToken);
    });

    it('devrait gérer les erreurs d\'authentification', async () => {
      const updateData: UpdateProfileData = {
        firstName: 'Test',
      };

      const mockError = new Error('Token invalide ou expiré.');

      (api.patch as jest.Mock).mockRejectedValue(mockError);

      await expect(authService.updateProfile(updateData, mockAccessToken)).rejects.toThrow(
        'Token invalide ou expiré.'
      );
    });

    it('devrait gérer les erreurs de mot de passe incorrect', async () => {
      const updateData: UpdateProfileData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
      };

      const mockError = new Error('Mot de passe actuel incorrect.');

      (api.patch as jest.Mock).mockRejectedValue(mockError);

      await expect(authService.updateProfile(updateData, mockAccessToken)).rejects.toThrow(
        'Mot de passe actuel incorrect.'
      );
    });

    it('devrait gérer les erreurs serveur', async () => {
      const updateData: UpdateProfileData = {
        firstName: 'Test',
      };

      const mockError = new Error('Erreur serveur.');

      (api.patch as jest.Mock).mockRejectedValue(mockError);

      await expect(authService.updateProfile(updateData, mockAccessToken)).rejects.toThrow(
        'Erreur serveur.'
      );
    });

    it('devrait appeler l\'API patch avec le bon endpoint', async () => {
      const updateData: UpdateProfileData = {
        firstName: 'Test',
      };

      const mockResponse = {
        message: 'Profil mis à jour avec succès.',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'PARTICIPANT',
        },
      };

      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      await authService.updateProfile(updateData, mockAccessToken);

      expect(api.patch).toHaveBeenCalledTimes(1);
      expect(api.patch).toHaveBeenCalledWith(
        '/auth/profile',
        expect.any(Object),
        mockAccessToken
      );
    });

    it('devrait gérer les réponses avec createdAt', async () => {
      const updateData: UpdateProfileData = {
        firstName: 'Test',
      };

      const mockResponse = {
        message: 'Profil mis à jour avec succès.',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'PARTICIPANT',
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      };

      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.updateProfile(updateData, mockAccessToken);

      expect(result.user.createdAt).toBe('2024-01-15T10:30:00.000Z');
    });
  });

  describe('updateProfile - Edge Cases', () => {
    it('devrait envoyer un objet vide si aucune donnée fournie', async () => {
      const updateData: UpdateProfileData = {};

      const mockResponse = {
        message: 'Aucune modification fournie.',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'PARTICIPANT',
        },
      };

      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      await authService.updateProfile(updateData, mockAccessToken);

      expect(api.patch).toHaveBeenCalledWith('/auth/profile', {}, mockAccessToken);
    });

    it('devrait gérer les noms avec des caractères spéciaux', async () => {
      const updateData: UpdateProfileData = {
        firstName: "Jean-François",
        lastName: "O'Connor",
      };

      const mockResponse = {
        message: 'Profil mis à jour avec succès.',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: "Jean-François",
          lastName: "O'Connor",
          role: 'PARTICIPANT',
        },
      };

      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.updateProfile(updateData, mockAccessToken);

      expect(result.user.firstName).toBe("Jean-François");
      expect(result.user.lastName).toBe("O'Connor");
    });
  });
});
