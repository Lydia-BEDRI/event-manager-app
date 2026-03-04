/* eslint-disable testing-library/no-wait-for-multiple-assertions */
/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePage from '../ProfilePage';
import { useAuth } from '../../../contexts/AuthContext';
import { authService } from '../../../services/auth.service';

jest.mock('../../../contexts/AuthContext');
jest.mock('../../../services/auth.service');

describe('ProfilePage', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'PARTICIPANT',
    createdAt: '2024-01-15T10:30:00.000Z',
  };

  const mockAccessToken = 'mock-access-token';
  const mockUpdateUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      accessToken: mockAccessToken,
      updateUser: mockUpdateUser,
    });
  });

  describe('Rendering', () => {
    it('devrait afficher les informations de l\'utilisateur', () => {
      render(<ProfilePage />);

      expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jean')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Dupont')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('devrait afficher le rôle de l\'utilisateur', () => {
      render(<ProfilePage />);

      expect(screen.getByText('Participant')).toBeInTheDocument();
    });

    it('devrait afficher la date de création du compte', () => {
      render(<ProfilePage />);

      expect(screen.getByText(/15 janvier 2024/i)).toBeInTheDocument();
    });

    it('devrait afficher "Date non disponible" si createdAt est manquant', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, createdAt: undefined },
        accessToken: mockAccessToken,
        updateUser: mockUpdateUser,
      });

      render(<ProfilePage />);

      expect(screen.getByText('Date non disponible')).toBeInTheDocument();
    });

    it('devrait afficher le badge ADMIN pour un administrateur', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { ...mockUser, role: 'ADMIN' },
        accessToken: mockAccessToken,
        updateUser: mockUpdateUser,
      });

      render(<ProfilePage />);

      expect(screen.getByText('Administrateur')).toBeInTheDocument();
    });

    it('devrait afficher tous les champs du formulaire', () => {
      render(<ProfilePage />);

      expect(screen.getByPlaceholderText(/votre prénom/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/votre nom/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(/••••••••/)[0]).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(/••••••••/)[1]).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(/••••••••/)[2]).toBeInTheDocument();
    });

    it('devrait avoir le champ email désactivé', () => {
      render(<ProfilePage />);

      const emailInput = screen.getByDisplayValue('test@example.com');
      expect(emailInput).toBeDisabled();
    });
  });

  describe('Form Submission - Success Cases', () => {
    it('devrait mettre à jour le prénom et nom avec succès', async () => {
      const mockResponse = {
        message: 'Profil mis à jour avec succès !',
        user: { ...mockUser, firstName: 'Pierre', lastName: 'Martin' },
      };

      (authService.updateProfile as jest.Mock).mockResolvedValue(mockResponse);

      render(<ProfilePage />);

      const firstNameInput = screen.getByDisplayValue('Jean');
      const lastNameInput = screen.getByDisplayValue('Dupont');
      const submitButton = screen.getByText(/enregistrer les modifications/i);

      fireEvent.change(firstNameInput, { target: { value: 'Pierre' } });
      fireEvent.change(lastNameInput, { target: { value: 'Martin' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authService.updateProfile).toHaveBeenCalledWith(
          {
            firstName: 'Pierre',
            lastName: 'Martin',
          },
          mockAccessToken
        );
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith(mockResponse.user);
      });

      await waitFor(() => {
        expect(screen.getByText('Profil mis à jour avec succès !')).toBeInTheDocument();
      });
    });

    it('devrait changer le mot de passe avec succès', async () => {
      const mockResponse = {
        message: 'Profil mis à jour avec succès. Vous devez vous reconnecter.',
        user: mockUser,
      };

      (authService.updateProfile as jest.Mock).mockResolvedValue(mockResponse);

      render(<ProfilePage />);

      const currentPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[0];
      const newPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[1];
      const confirmPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[2];
      const submitButton = screen.getByText(/enregistrer les modifications/i);

      fireEvent.change(currentPasswordInput, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newPassword456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newPassword456' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authService.updateProfile).toHaveBeenCalledWith(
          {
            currentPassword: 'oldPassword123',
            newPassword: 'newPassword456',
          },
          mockAccessToken
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/vous devez vous reconnecter/i)).toBeInTheDocument();
      });
    });

    it('devrait mettre à jour les informations et changer le mot de passe simultanément', async () => {
      const mockResponse = {
        message: 'Profil mis à jour avec succès. Vous devez vous reconnecter.',
        user: { ...mockUser, firstName: 'Alice' },
      };

      (authService.updateProfile as jest.Mock).mockResolvedValue(mockResponse);

      render(<ProfilePage />);

      const firstNameInput = screen.getByDisplayValue('Jean');
      const currentPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[0];
      const newPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[1];
      const confirmPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[2];
      const submitButton = screen.getByText(/enregistrer les modifications/i);

      fireEvent.change(firstNameInput, { target: { value: 'Alice' } });
      fireEvent.change(currentPasswordInput, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newPassword456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newPassword456' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authService.updateProfile).toHaveBeenCalledWith(
          {
            firstName: 'Alice',
            currentPassword: 'oldPassword123',
            newPassword: 'newPassword456',
          },
          mockAccessToken
        );
      });
    });
  });

  describe('Form Validation', () => {
    it('devrait afficher une erreur si aucune modification n\'est détectée', async () => {
      render(<ProfilePage />);

      const submitButton = screen.getByText(/enregistrer les modifications/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Aucune modification détectée.')).toBeInTheDocument();
      });

      expect(authService.updateProfile).not.toHaveBeenCalled();
    });

    it('devrait afficher une erreur si le mot de passe actuel est manquant', async () => {
      render(<ProfilePage />);

      const newPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[1];
      const confirmPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[2];
      const submitButton = screen.getByText(/enregistrer les modifications/i);

      fireEvent.change(newPasswordInput, { target: { value: 'newPassword456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newPassword456' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Veuillez entrer votre mot de passe actuel.')).toBeInTheDocument();
      });

      expect(authService.updateProfile).not.toHaveBeenCalled();
    });

    it('devrait afficher une erreur si les mots de passe ne correspondent pas', async () => {
      render(<ProfilePage />);

      const currentPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[0];
      const newPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[1];
      const confirmPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[2];
      const submitButton = screen.getByText(/enregistrer les modifications/i);

      fireEvent.change(currentPasswordInput, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newPassword456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentPassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument();
      });

      expect(authService.updateProfile).not.toHaveBeenCalled();
    });

    it('devrait afficher une erreur si le nouveau mot de passe est trop court', async () => {
      render(<ProfilePage />);

      const currentPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[0];
      const newPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[1];
      const confirmPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[2];
      const submitButton = screen.getByText(/enregistrer les modifications/i);

      fireEvent.change(currentPasswordInput, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'short' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/au moins 8 caractères/i)).toBeInTheDocument();
      });

      expect(authService.updateProfile).not.toHaveBeenCalled();
    });

    it('devrait afficher une erreur si accessToken est manquant', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        accessToken: null,
        updateUser: mockUpdateUser,
      });

      render(<ProfilePage />);

      const firstNameInput = screen.getByDisplayValue('Jean');
      const submitButton = screen.getByText(/enregistrer les modifications/i);

      fireEvent.change(firstNameInput, { target: { value: 'Pierre' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/vous devez être connecté/i)).toBeInTheDocument();
      });

      expect(authService.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('devrait afficher une erreur en cas d\'échec de la mise à jour', async () => {
      (authService.updateProfile as jest.Mock).mockRejectedValue({
        message: 'Erreur serveur.',
      });

      render(<ProfilePage />);

      const firstNameInput = screen.getByDisplayValue('Jean');
      const submitButton = screen.getByText(/enregistrer les modifications/i);

      fireEvent.change(firstNameInput, { target: { value: 'Pierre' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Erreur serveur.')).toBeInTheDocument();
      });
    });

    it('devrait gérer les erreurs de mot de passe incorrect', async () => {
      (authService.updateProfile as jest.Mock).mockRejectedValue({
        message: 'Mot de passe actuel incorrect.',
      });

      render(<ProfilePage />);

      const currentPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[0];
      const newPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[1];
      const confirmPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[2];
      const submitButton = screen.getByText(/enregistrer les modifications/i);

      fireEvent.change(currentPasswordInput, { target: { value: 'wrongPassword' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newPassword456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newPassword456' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Mot de passe actuel incorrect.')).toBeInTheDocument();
      });
    });
  });

  describe('UI Interactions', () => {
    it('devrait basculer la visibilité du mot de passe actuel', () => {
      render(<ProfilePage />);

      const currentPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[0];
      const toggleButtons = screen.getAllByRole('button', { name: '' });

      expect(currentPasswordInput).toHaveAttribute('type', 'password');

      const toggleCurrentPassword = toggleButtons[0];
      fireEvent.click(toggleCurrentPassword);

      expect(currentPasswordInput).toHaveAttribute('type', 'text');

      fireEvent.click(toggleCurrentPassword);

      expect(currentPasswordInput).toHaveAttribute('type', 'password');
    });

    it('devrait basculer la visibilité du nouveau mot de passe', () => {
      render(<ProfilePage />);

      const newPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[1];
      const toggleButtons = screen.getAllByRole('button', { name: '' });

      expect(newPasswordInput).toHaveAttribute('type', 'password');

      const toggleNewPassword = toggleButtons[1];
      fireEvent.click(toggleNewPassword);

      expect(newPasswordInput).toHaveAttribute('type', 'text');
    });

    it('devrait réinitialiser les champs de mot de passe après une mise à jour réussie', async () => {
      const mockResponse = {
        message: 'Profil mis à jour avec succès !',
        user: mockUser,
      };

      (authService.updateProfile as jest.Mock).mockResolvedValue(mockResponse);

      render(<ProfilePage />);

      const currentPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[0];
      const newPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[1];
      const confirmPasswordInput = screen.getAllByPlaceholderText(/••••••••/)[2];
      const submitButton = screen.getByText(/enregistrer les modifications/i);

      fireEvent.change(currentPasswordInput, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newPassword456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newPassword456' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect((currentPasswordInput as HTMLInputElement).value).toBe('');
        expect((newPasswordInput as HTMLInputElement).value).toBe('');
        expect((confirmPasswordInput as HTMLInputElement).value).toBe('');
      });
    });

    it('devrait désactiver le bouton pendant le chargement', async () => {
      const mockResponse = {
        message: 'Profil mis à jour avec succès !',
        user: { ...mockUser, firstName: 'Pierre' },
      };

      (authService.updateProfile as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
      );

      render(<ProfilePage />);

      const firstNameInput = screen.getByDisplayValue('Jean');
      const submitButton = screen.getByText(/enregistrer les modifications/i);

      fireEvent.change(firstNameInput, { target: { value: 'Pierre' } });
      fireEvent.click(submitButton);

      expect(screen.getByText('Enregistrement...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText(/enregistrer les modifications/i)).toBeInTheDocument();
      });
    });
  });
});
