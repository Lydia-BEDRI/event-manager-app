/// <reference types="jest" />

import { exportService, ExportFilters } from '../export.service';

const mockCreateElement = jest.fn();
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = jest.fn();

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

global.fetch = jest.fn();

describe('Export Service', () => {
  let mockLink: any;

  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    Object.defineProperty(window.URL, 'createObjectURL', {
      value: mockCreateObjectURL,
      writable: true,
    });

    Object.defineProperty(window.URL, 'revokeObjectURL', {
      value: mockRevokeObjectURL,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-access-token');
    
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    
    mockLink = {
      href: '',
      download: '',
      click: mockClick,
    };

    mockCreateElement.mockReturnValue(mockLink);
    document.createElement = mockCreateElement as any;
    document.body.appendChild = mockAppendChild as any;
    document.body.removeChild = mockRemoveChild as any;
  });

  const mockSuccessfulBlobResponse = () => {
    const blob = new Blob(['mock csv content'], { type: 'text/csv' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: async () => blob,
    });
  };

  const mockFailedResponse = (status: number = 500, message: string = 'Server error') => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status,
      text: async () => message,
    });
  };

  describe('exportEvents', () => {
    it('devrait exporter les événements sans filtres', async () => {
      mockSuccessfulBlobResponse();

      await exportService.exportEvents();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/export/events',
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Authorization: 'Bearer mock-access-token',
          },
        }
      );

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('devrait exporter les événements avec filtres de dates', async () => {
      mockSuccessfulBlobResponse();

      const filters: ExportFilters = {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      };

      await exportService.exportEvents(filters);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/export/events?startDate=2026-01-01&endDate=2026-12-31',
        expect.any(Object)
      );
    });

    it('devrait gérer les erreurs lors de l\'export', async () => {
      mockFailedResponse(500, 'Erreur serveur');

      await expect(exportService.exportEvents()).rejects.toThrow('Erreur serveur');
    });

    it('devrait refuser l’export si non connecté', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(exportService.exportEvents()).rejects.toThrow(
        'Token manquant. Veuillez vous reconnecter.'
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('exportParticipations', () => {
    it('devrait exporter les participations avec tous les filtres', async () => {
      mockSuccessfulBlobResponse();

      const filters: ExportFilters = {
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        eventId: '5',
      };

      await exportService.exportParticipations(filters);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/export/participations?startDate=2026-02-01&endDate=2026-02-28&eventId=5',
        expect.any(Object)
      );
      expect(mockClick).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs 401 avec refresh invalide', async () => {
      mockFailedResponse(401, 'Non autorisé');

      await expect(exportService.exportParticipations()).rejects.toThrow('Erreur API');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
    });
  });

  describe('exportAccessLogs', () => {
    it('devrait exporter les logs d\'accès avec filtres complets', async () => {
      mockSuccessfulBlobResponse();

      const filters: ExportFilters = {
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        eventId: '3',
        zoneId: '7',
      };

      await exportService.exportAccessLogs(filters);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/export/access-logs?'),
        expect.any(Object)
      );

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('startDate=2026-03-01');
      expect(url).toContain('endDate=2026-03-31');
      expect(url).toContain('eventId=3');
      expect(url).toContain('zoneId=7');
    });
  });

  describe('exportUsers', () => {
    it('devrait exporter les utilisateurs avec filtre par rôle', async () => {
      mockSuccessfulBlobResponse();

      const filters: ExportFilters = {
        role: 'PARTICIPANT',
        startDate: '2026-01-01',
      };

      await exportService.exportUsers(filters);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('role=PARTICIPANT'),
        expect.any(Object)
      );
    });

    it('devrait télécharger le fichier avec le bon nom', async () => {
      mockSuccessfulBlobResponse();

      await exportService.exportUsers();

      expect(mockLink.download).toMatch(/users_\d+\.csv/);
    });
  });

  describe('exportZones', () => {
    it('devrait exporter les zones filtrées par eventId', async () => {
      mockSuccessfulBlobResponse();

      const filters: ExportFilters = {
        eventId: '10',
      };

      await exportService.exportZones(filters);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/export/zones?eventId=10',
        expect.any(Object)
      );
    });

    it('devrait exporter toutes les zones si aucun filtre', async () => {
      mockSuccessfulBlobResponse();

      await exportService.exportZones();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/export/zones',
        expect.any(Object)
      );
    });
  });

  describe('exportStatistics', () => {
    it('devrait exporter les statistiques', async () => {
      mockSuccessfulBlobResponse();

      await exportService.exportStatistics();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/export/statistics',
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Authorization: 'Bearer mock-access-token',
          },
        }
      );
      expect(mockClick).toHaveBeenCalled();
    });

    it('devrait télécharger le fichier statistics avec timestamp', async () => {
      mockSuccessfulBlobResponse();

      await exportService.exportStatistics();

      expect(mockLink.download).toMatch(/statistics_\d+\.csv/);
    });
  });

  describe('exportComplete', () => {
    it('devrait exporter l\'export complet avec filtres', async () => {
      mockSuccessfulBlobResponse();

      const filters: ExportFilters = {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      };

      await exportService.exportComplete(filters);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/export/complete?startDate=2026-01-01&endDate=2026-12-31',
        expect.any(Object)
      );
    });

    it('devrait télécharger le fichier avec le nom export_complet', async () => {
      mockSuccessfulBlobResponse();

      await exportService.exportComplete();

      expect(mockLink.download).toMatch(/export_complet_\d+\.csv/);
    });
  });

  describe('buildQueryParams', () => {
    it('devrait construire les query params correctement', async () => {
      mockSuccessfulBlobResponse();

      const filters: ExportFilters = {
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        eventId: '5',
        role: 'ADMIN',
      };

      await exportService.exportUsers(filters);

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('?');
      expect(url).toContain('startDate=2026-01-01');
      expect(url).toContain('endDate=2026-12-31');
      expect(url).toContain('eventId=5');
      expect(url).toContain('role=ADMIN');
    });

    it('devrait ignorer les valeurs undefined et null', async () => {
      mockSuccessfulBlobResponse();

      const filters: ExportFilters = {
        startDate: '2026-01-01',
        endDate: undefined,
        eventId: '',
      };

      await exportService.exportEvents(filters);

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('startDate=2026-01-01');
      expect(url).not.toContain('endDate');
      expect(url).not.toContain('eventId');
    });
  });

  describe('Téléchargement de fichiers', () => {
    it('devrait créer et nettoyer correctement le lien de téléchargement', async () => {
      mockSuccessfulBlobResponse();

      await exportService.exportEvents();

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('devrait utiliser le bon type MIME pour le blob', async () => {
      const csvBlob = new Blob(['data'], { type: 'text/csv' });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: async () => csvBlob,
      });

      await exportService.exportEvents();

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs réseau', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(exportService.exportEvents()).rejects.toThrow('Network error');
    });

    it('devrait gérer les réponses non-ok avec message custom', async () => {
      mockFailedResponse(403, 'Accès refusé');

      await expect(exportService.exportEvents()).rejects.toThrow('Accès refusé');
    });

    it('devrait gérer les réponses non-ok sans message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => '',
      });

      await expect(exportService.exportEvents()).rejects.toThrow('Erreur lors de l\'export');
    });
  });
});
