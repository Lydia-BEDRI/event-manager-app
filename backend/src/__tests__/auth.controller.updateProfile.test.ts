import { Response } from 'express';
import { updateProfile } from '../controllers/auth.controller';
import { AuthenticatedRequest } from '../middlewares/authenticate';
import pool from '../config/database';
import bcrypt from 'bcrypt';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

describe('Auth Controller - updateProfile', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {
      user: {
        userId: 1,
        email: 'test@example.com',
        role: 'PARTICIPANT',
      },
      ip: '127.0.0.1',
      body: {},
    } as Partial<AuthenticatedRequest>;
    
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };
    
    jest.clearAllMocks();
  });

  describe('updateProfile - Success Cases', () => {
    it('devrait mettre à jour le prénom et nom avec succès', async () => {
      mockRequest.body = {
        firstName: 'Jean',
        lastName: 'Dupont',
      };

      const mockCurrentUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Old',
        last_name: 'Name',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      const mockUpdatedUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockCurrentUser]) // SELECT current user
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE first_name
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE last_name
        .mockResolvedValueOnce([{ insertId: 1 }]) // INSERT audit_logs
        .mockResolvedValueOnce([mockUpdatedUser]); // SELECT updated user

      await updateProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        message: 'Profil mis à jour avec succès.',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Jean',
          lastName: 'Dupont',
          role: 'PARTICIPANT',
          avatarUrl: undefined,
          createdAt: expect.any(Date),
        },
      });
    });

    it('devrait mettre à jour seulement le prénom', async () => {
      mockRequest.body = {
        firstName: 'Marie',
      };

      const mockCurrentUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Old',
        last_name: 'Martin',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      const mockUpdatedUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Marie',
        last_name: 'Martin',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockCurrentUser])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([mockUpdatedUser]);

      await updateProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        message: 'Profil mis à jour avec succès.',
        user: expect.objectContaining({
          firstName: 'Marie',
        }),
      });
    });

    it('devrait changer le mot de passe avec succès', async () => {
      mockRequest.body = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      const mockCurrentUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        password_hash: 'hashedOldPassword',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      const mockUpdatedUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockCurrentUser]) // SELECT current user
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE password
        .mockResolvedValueOnce([{ affectedRows: 2 }]) // UPDATE refresh_tokens (revoke)
        .mockResolvedValueOnce([{ insertId: 1 }]) // INSERT audit_logs
        .mockResolvedValueOnce([mockUpdatedUser]); // SELECT updated user

      await updateProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(bcrypt.compare).toHaveBeenCalledWith('oldPassword123', 'hashedOldPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword456', 12);

      expect(responseJson).toHaveBeenCalledWith({
        message: 'Profil mis à jour avec succès.',
        user: expect.any(Object),
      });
    });

    it('devrait mettre à jour le nom et changer le mot de passe simultanément', async () => {
      mockRequest.body = {
        firstName: 'Pierre',
        lastName: 'Durand',
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      const mockCurrentUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Old',
        last_name: 'Name',
        password_hash: 'hashedOldPassword',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      const mockUpdatedUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Pierre',
        last_name: 'Durand',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockCurrentUser])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([mockUpdatedUser]);

      await updateProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({
        message: 'Profil mis à jour avec succès.',
        user: expect.objectContaining({
          firstName: 'Pierre',
          lastName: 'Durand',
        }),
      });
    });
  });

  describe('updateProfile - Error Cases', () => {
    it('devrait retourner 401 si aucun utilisateur authentifié', async () => {
      mockRequest.user = undefined;

      await updateProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Non authentifié.',
      });
    });

    it('devrait retourner 404 si utilisateur introuvable', async () => {
      mockRequest.body = {
        firstName: 'Test',
      };

      (pool.query as jest.Mock).mockResolvedValueOnce([[]]); // Aucun utilisateur trouvé

      await updateProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Utilisateur introuvable.',
      });
    });

    it('devrait retourner 401 si le mot de passe actuel est incorrect', async () => {
      mockRequest.body = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
      };

      const mockCurrentUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        password_hash: 'hashedOldPassword',
      }];

      (pool.query as jest.Mock).mockResolvedValueOnce([mockCurrentUser]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await updateProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Mot de passe actuel incorrect.',
      });
    });

    it('devrait retourner 500 en cas d\'erreur serveur', async () => {
      mockRequest.body = {
        firstName: 'Test',
      };

      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Erreur serveur.',
      });
    });
  });

  describe('updateProfile - Audit Logs', () => {
    it('devrait créer un log d\'audit pour la mise à jour du profil', async () => {
      mockRequest.body = {
        firstName: 'John',
      };

      const mockCurrentUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Old',
        last_name: 'Doe',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      const mockUpdatedUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockCurrentUser])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([mockUpdatedUser]);

      await updateProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.any(Array)
      );
      
      const auditCall = (pool.query as jest.Mock).mock.calls.find(
        call => call[0].includes('INSERT INTO audit_logs')
      );
      expect(auditCall).toBeDefined();
      expect(auditCall[1]).toEqual(
        expect.arrayContaining([1, 1, '127.0.0.1'])
      );
    });

    it('devrait créer un log d\'audit pour le changement de mot de passe', async () => {
      mockRequest.body = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      const mockCurrentUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        password_hash: 'hashedOldPassword',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      const mockUpdatedUser = [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'PARTICIPANT',
        created_at: new Date('2024-01-01'),
      }];

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');

      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockCurrentUser])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 2 }])
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([mockUpdatedUser]);

      await updateProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.any(Array)
      );
      
      // Vérifier le log d'audit pour changement de mot de passe
      const auditCall = (pool.query as jest.Mock).mock.calls.find(
        call => call[0].includes('INSERT INTO audit_logs')
      );
      expect(auditCall).toBeDefined();
      expect(auditCall[1]).toEqual(
        expect.arrayContaining([1, 1, '127.0.0.1'])
      );
    });
  });
});
