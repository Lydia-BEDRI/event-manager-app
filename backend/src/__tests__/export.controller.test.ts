import { Request, Response } from 'express';
import {
  exportEvents,
  exportParticipations,
  exportAccessLogs,
  exportUsers,
  exportZones,
  exportStatistics,
  exportComplete
} from '../controllers/export.controller';
import pool from '../config/database';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Export Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseSend: jest.Mock;
  let responseStatus: jest.Mock;
  let responseJson: jest.Mock;
  let responseSetHeader: jest.Mock;

  beforeEach(() => {
    responseSend = jest.fn();
    responseSetHeader = jest.fn();
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {
      query: {},
    };
    mockResponse = {
      send: responseSend,
      setHeader: responseSetHeader,
      status: responseStatus,
      json: responseJson,
    };
    
    jest.clearAllMocks();
  });

  describe('exportEvents', () => {
    it('devrait exporter les événements en CSV avec succès', async () => {
      const mockEvents = [
        {
          'ID Événement': 1,
          'Titre': 'Event Test',
          'Description': 'Description test',
          'Date Début': '2026-03-01',
          'Date Fin': '2026-03-02',
          'Lieu': 'Paris',
          'Capacité': 100,
          'Statut': 'ACTIVE',
          'Créé le': '2026-02-01',
          'Nombre Participants': 10,
          'Nombre Zones': 3
        }
      ];

      (pool.query as jest.Mock).mockResolvedValue([mockEvents]);

      await exportEvents(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalled();
      expect(responseSetHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(responseSetHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/attachment; filename=events_\d+\.csv/)
      );
      expect(responseSend).toHaveBeenCalled();
      
      const csvContent = responseSend.mock.calls[0][0];
      expect(csvContent).toContain('ID Événement');
      expect(csvContent).toContain('Event Test');
    });

    it('devrait filtrer les événements par dates', async () => {
      mockRequest.query = {
        startDate: '2026-03-01',
        endDate: '2026-03-31'
      };

      (pool.query as jest.Mock).mockResolvedValue([[]]);

      await exportEvents(mockRequest as Request, mockResponse as Response);

      const queryCall = (pool.query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('AND e.start_date >= ?');
      expect(queryCall[0]).toContain('AND e.end_date <= ?');
      expect(queryCall[1]).toEqual(['2026-03-01', '2026-03-31']);
    });

    it('devrait gérer les erreurs lors de l\'export', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await exportEvents(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Erreur lors de l\'export des événements'
      });
    });
  });

  describe('exportParticipations', () => {
    it('devrait exporter les participations en CSV avec succès', async () => {
      const mockParticipations = [
        {
          'ID Participation': 1,
          'Email Participant': 'user@test.com',
          'Nom Complet': 'John Doe',
          'Événement': 'Event Test',
          'Statut': 'APPROVED',
          'Inscrit le': '2026-02-15',
          'QR Code': 'QR123',
          'Nombre Accès': 5
        }
      ];

      (pool.query as jest.Mock).mockResolvedValue([mockParticipations]);

      await exportParticipations(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalled();
      expect(responseSetHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(responseSend).toHaveBeenCalled();
      
      const csvContent = responseSend.mock.calls[0][0];
      expect(csvContent).toContain('ID Participation');
      expect(csvContent).toContain('user@test.com');
    });

    it('devrait filtrer les participations par dates et eventId', async () => {
      mockRequest.query = {
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        eventId: '5'
      };

      (pool.query as jest.Mock).mockResolvedValue([[]]);

      await exportParticipations(mockRequest as Request, mockResponse as Response);

      const queryCall = (pool.query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('AND p.created_at >= ?');
      expect(queryCall[0]).toContain('AND p.created_at <= ?');
      expect(queryCall[0]).toContain('AND p.event_id = ?');
      expect(queryCall[1]).toEqual(['2026-02-01', '2026-02-28', '5']);
    });

    it('devrait gérer les erreurs lors de l\'export', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await exportParticipations(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Erreur lors de l\'export des participations'
      });
    });
  });

  describe('exportAccessLogs', () => {
    it('devrait exporter les logs d\'accès en CSV avec succès', async () => {
      const mockAccessLogs = [
        {
          'ID Accès': 1,
          'Email Participant': 'user@test.com',
          'Nom Complet': 'John Doe',
          'Événement': 'Event Test',
          'Zone': 'Zone A',
          'Heure Accès': '2026-03-01 10:00:00',
          'Valide': 1,
          'Adresse IP': '192.168.1.1'
        }
      ];

      (pool.query as jest.Mock).mockResolvedValue([mockAccessLogs]);

      await exportAccessLogs(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalled();
      expect(responseSetHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(responseSend).toHaveBeenCalled();
      
      const csvContent = responseSend.mock.calls[0][0];
      expect(csvContent).toContain('ID Accès');
      expect(csvContent).toContain('Zone A');
    });

    it('devrait filtrer les logs par dates, eventId et zoneId', async () => {
      mockRequest.query = {
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        eventId: '5',
        zoneId: '2'
      };

      (pool.query as jest.Mock).mockResolvedValue([[]]);

      await exportAccessLogs(mockRequest as Request, mockResponse as Response);

      const queryCall = (pool.query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('AND a.scanned_at >= ?');
      expect(queryCall[0]).toContain('AND a.scanned_at <= ?');
      expect(queryCall[0]).toContain('AND p.event_id = ?');
      expect(queryCall[0]).toContain('AND a.zone_id = ?');
      expect(queryCall[1]).toEqual(['2026-03-01', '2026-03-31', '5', '2']);
    });
  });

  describe('exportUsers', () => {
    it('devrait exporter les utilisateurs en CSV avec succès', async () => {
      const mockUsers = [
        {
          'ID Utilisateur': 1,
          'Email': 'admin@test.com',
          'Nom Complet': 'Admin User',
          'Rôle': 'ADMIN',
          'Créé le': '2026-01-01',
          'Actif': 1,
          'Nombre Participations': 0,
          'Nombre Accès': 0
        }
      ];

      (pool.query as jest.Mock).mockResolvedValue([mockUsers]);

      await exportUsers(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalled();
      expect(responseSetHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(responseSend).toHaveBeenCalled();
      
      const csvContent = responseSend.mock.calls[0][0];
      expect(csvContent).toContain('ID Utilisateur');
      expect(csvContent).toContain('admin@test.com');
    });

    it('devrait filtrer les utilisateurs par rôle et dates', async () => {
      mockRequest.query = {
        role: 'PARTICIPANT',
        startDate: '2026-01-01',
        endDate: '2026-12-31'
      };

      (pool.query as jest.Mock).mockResolvedValue([[]]);

      await exportUsers(mockRequest as Request, mockResponse as Response);

      const queryCall = (pool.query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('AND u.role = ?');
      expect(queryCall[0]).toContain('AND u.created_at >= ?');
      expect(queryCall[0]).toContain('AND u.created_at <= ?');
      expect(queryCall[1]).toEqual(['PARTICIPANT', '2026-01-01', '2026-12-31']);
    });
  });

  describe('exportZones', () => {
    it('devrait exporter les zones en CSV avec succès', async () => {
      const mockZones = [
        {
          'ID Zone': 1,
          'Nom': 'Zone VIP',
          'Description': 'Zone VIP description',
          'Événement': 'Event Test',
          'Capacité': 50,
          'Nombre Accès Total': 45
        }
      ];

      (pool.query as jest.Mock).mockResolvedValue([mockZones]);

      await exportZones(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalled();
      expect(responseSetHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(responseSend).toHaveBeenCalled();
      
      const csvContent = responseSend.mock.calls[0][0];
      expect(csvContent).toContain('ID Zone');
      expect(csvContent).toContain('Zone VIP');
    });

    it('devrait filtrer les zones par eventId', async () => {
      mockRequest.query = {
        eventId: '3'
      };

      (pool.query as jest.Mock).mockResolvedValue([[]]);

      await exportZones(mockRequest as Request, mockResponse as Response);

      const queryCall = (pool.query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('AND z.event_id = ?');
      expect(queryCall[1]).toEqual(['3']);
    });
  });

  describe('exportStatistics', () => {
    it('devrait exporter les statistiques en CSV avec succès', async () => {
      const mockStats = [
        { 'Métrique': 'Événements Total', 'Valeur': 10 },
        { 'Métrique': 'Événements Actifs', 'Valeur': 5 },
        { 'Métrique': 'Participants Total', 'Valeur': 100 },
        { 'Métrique': 'Participations Total', 'Valeur': 150 }
      ];

      (pool.query as jest.Mock).mockResolvedValue([mockStats]);

      await exportStatistics(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalled();
      expect(responseSetHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(responseSend).toHaveBeenCalled();
      
      const csvContent = responseSend.mock.calls[0][0];
      expect(csvContent).toContain('Métrique');
      expect(csvContent).toContain('Événements Total');
    });

    it('devrait gérer les erreurs lors de l\'export de statistiques', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await exportStatistics(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Erreur lors de l\'export des statistiques'
      });
    });
  });

  describe('exportComplete', () => {
    it('devrait exporter toutes les données en CSV avec succès', async () => {
      const mockCompleteData = [
        {
          'ID Événement': 1,
          'Événement': 'Event Test',
          'Date Début': '2026-03-01',
          'Date Fin': '2026-03-02',
          'Statut Événement': 'ACTIVE',
          'Lieu': 'Paris',
          'Email Participant': 'user@test.com',
          'Nom Participant': 'John Doe',
          'Statut Participation': 'APPROVED',
          'Date Inscription': '2026-02-15',
          'QR Code': 'QR123',
          'Nombre Accès': 5
        }
      ];

      (pool.query as jest.Mock).mockResolvedValue([mockCompleteData]);

      await exportComplete(mockRequest as Request, mockResponse as Response);

      expect(pool.query).toHaveBeenCalled();
      expect(responseSetHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(responseSetHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringMatching(/attachment; filename=export_complet_\d+\.csv/)
      );
      expect(responseSend).toHaveBeenCalled();
      
      const csvContent = responseSend.mock.calls[0][0];
      expect(csvContent).toContain('ID Événement');
      expect(csvContent).toContain('Event Test');
    });

    it('devrait filtrer l\'export complet par dates', async () => {
      mockRequest.query = {
        startDate: '2026-03-01',
        endDate: '2026-03-31'
      };

      (pool.query as jest.Mock).mockResolvedValue([[]]);

      await exportComplete(mockRequest as Request, mockResponse as Response);

      const queryCall = (pool.query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('WHERE');
      expect(queryCall[0]).toContain('e.start_date >= ?');
      expect(queryCall[0]).toContain('e.end_date <= ?');
      expect(queryCall[1]).toEqual(['2026-03-01', '2026-03-31']);
    });

    it('devrait gérer les erreurs lors de l\'export complet', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      await exportComplete(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        error: 'Erreur lors de l\'export complet'
      });
    });
  });

  describe('CSV Formatting', () => {
    it('devrait échapper correctement les valeurs avec des virgules', async () => {
      const mockEvents = [
        {
          'ID Événement': 1,
          'Titre': 'Event, with comma',
          'Description': 'Description test',
          'Date Début': '2026-03-01',
          'Date Fin': '2026-03-02',
          'Lieu': 'Paris, France',
          'Capacité': 100,
          'Statut': 'ACTIVE',
          'Créé le': '2026-02-01',
          'Nombre Participants': 10,
          'Nombre Zones': 3
        }
      ];

      (pool.query as jest.Mock).mockResolvedValue([mockEvents]);

      await exportEvents(mockRequest as Request, mockResponse as Response);

      const csvContent = responseSend.mock.calls[0][0];
      expect(csvContent).toContain('"Event, with comma"');
      expect(csvContent).toContain('"Paris, France"');
    });

    it('devrait gérer les valeurs null et undefined', async () => {
      const mockEvents = [
        {
          'ID Événement': 1,
          'Titre': 'Event Test',
          'Description': null,
          'Date Début': '2026-03-01',
          'Date Fin': '2026-03-02',
          'Lieu': undefined,
          'Capacité': 100,
          'Statut': 'ACTIVE',
          'Créé le': '2026-02-01',
          'Nombre Participants': 0,
          'Nombre Zones': 0
        }
      ];

      (pool.query as jest.Mock).mockResolvedValue([mockEvents]);

      await exportEvents(mockRequest as Request, mockResponse as Response);

      expect(responseSend).toHaveBeenCalled();
      const csvContent = responseSend.mock.calls[0][0];
      expect(csvContent).toContain('Event Test');
    });
  });
});
