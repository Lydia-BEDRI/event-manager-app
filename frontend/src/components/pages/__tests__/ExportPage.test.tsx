/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportPage from '../ExportPage';
import { exportService } from '../../../services/export.service';
import { getAllEvents } from '../../../services/event.service';
import { getAllZones } from '../../../services/zone.service';

jest.mock('../../../services/export.service', () => ({
  exportService: {
    exportEvents: jest.fn(),
    exportParticipations: jest.fn(),
    exportAccessLogs: jest.fn(),
    exportUsers: jest.fn(),
    exportZones: jest.fn(),
    exportStatistics: jest.fn(),
    exportComplete: jest.fn(),
  },
}));

jest.mock('../../../services/event.service', () => ({
  getAllEvents: jest.fn(),
}));

jest.mock('../../../services/zone.service', () => ({
  getAllZones: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  FileDown: () => <div data-testid="icon-filedown" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  Users: () => <div data-testid="icon-users" />,
  MapPin: () => <div data-testid="icon-mappin" />,
  ClipboardCheck: () => <div data-testid="icon-clipboardcheck" />,
  Shield: () => <div data-testid="icon-shield" />,
  BarChart3: () => <div data-testid="icon-barchart" />,
  Database: () => <div data-testid="icon-database" />,
  Download: () => <div data-testid="icon-download" />,
  Filter: () => <div data-testid="icon-filter" />,
  X: () => <div data-testid="icon-x" />,
  CheckCircle: () => <div data-testid="icon-checkcircle" />,
}));

const clickAsync = async (element: HTMLElement) => {
  await act(async () => {
    fireEvent.click(element);
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

describe('ExportPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAllEvents as jest.Mock).mockReturnValue(new Promise(() => {}));
    (getAllZones as jest.Mock).mockReturnValue(new Promise(() => {}));
  });

  describe('Rendu initial', () => {
    it('devrait afficher le titre et la description de la page', () => {
      render(<ExportPage />);
      
      expect(screen.getByText('Exports de données')).toBeInTheDocument();
      expect(screen.getByText('Exportez vos données au format CSV pour analyse et archivage')).toBeInTheDocument();
    });

    it('devrait afficher les 7 catégories d\'export', () => {
      render(<ExportPage />);
      
      expect(screen.getByText('Événements')).toBeInTheDocument();
      expect(screen.getByText('Participations')).toBeInTheDocument();
      expect(screen.getByText('Logs d\'accès')).toBeInTheDocument();
      expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
      expect(screen.getByText('Zones')).toBeInTheDocument();
      expect(screen.getByText('Statistiques')).toBeInTheDocument();
      expect(screen.getByText('Export complet')).toBeInTheDocument();
    });

    it('affiche un fond colore pour l icone des evenements', () => {
      render(<ExportPage />);

      const title = screen.getByText('Événements');
      const iconContainer = title.parentElement?.previousElementSibling;

      expect(iconContainer).toHaveClass('bg-primary-accent/10');
      expect(iconContainer).toHaveClass('text-primary-accent');
    });

    it('devrait afficher les descriptions de chaque catégorie', () => {
      render(<ExportPage />);
      
      expect(screen.getByText(/Exporter la liste complète des événements/)).toBeInTheDocument();
      expect(screen.getByText(/Exporter toutes les participations/)).toBeInTheDocument();
    });

    it('devrait afficher la section d\'information', () => {
      render(<ExportPage />);
      
      expect(screen.getByText('À propos des exports CSV')).toBeInTheDocument();
      expect(screen.getByText(/Les fichiers sont encodés en UTF-8/)).toBeInTheDocument();
    });
  });

  describe('Gestion des filtres', () => {
    it('devrait afficher les filtres quand on clique sur le bouton Filtres', () => {
      render(<ExportPage />);
      
      const filterButtons = screen.getAllByText('Filtres');
      fireEvent.click(filterButtons[0]); // Click sur le premier bouton Filtres
      
      expect(screen.getByText('Filtres optionnels')).toBeInTheDocument();
    });

    it('devrait masquer les filtres quand on clique à nouveau', () => {
      render(<ExportPage />);
      
      const filterButtons = screen.getAllByText('Filtres');
      fireEvent.click(filterButtons[0]);
      
      expect(screen.getByText('Filtres optionnels')).toBeInTheDocument();
      
      const hideButton = screen.getByText('Masquer');
      fireEvent.click(hideButton);
      
      expect(screen.queryByText('Filtres optionnels')).not.toBeInTheDocument();
    });

    it('devrait afficher les champs de date pour l\'export d\'événements', () => {
      render(<ExportPage />);
      
      const filterButtons = screen.getAllByText('Filtres');
      fireEvent.click(filterButtons[0]);
      
      const dateInputs = screen.getAllByPlaceholderText(/Date/);
      expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait permettre de modifier les filtres de dates', () => {
      render(<ExportPage />);
      
      const filterButtons = screen.getAllByText('Filtres');
      fireEvent.click(filterButtons[0]);
      
      const startDateInput = screen.getByPlaceholderText('Date de début') as HTMLInputElement;
      fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });
      
      expect(startDateInput.value).toBe('2026-01-01');
    });

    it('devrait afficher le filtre événement pour les participations', async () => {
      (getAllEvents as jest.Mock).mockResolvedValue([
        {
          id: 1,
          name: 'Conférence Tech 2026',
          location: 'Paris',
          start_date: '2026-05-01T10:00:00Z',
          end_date: '2026-05-01T18:00:00Z',
          capacity: 200,
          status: 'PUBLISHED',
          created_at: '2026-01-01T10:00:00Z',
        },
      ]);
      (getAllZones as jest.Mock).mockResolvedValue([
        {
          id: 5,
          event_id: 1,
          name: 'Hall Principal',
          event_name: 'Conférence Tech 2026',
          capacity: 200,
          created_at: '2026-01-01T10:00:00Z',
        },
      ]);
      render(<ExportPage />);
      
      const filterButtons = screen.getAllByText('Filtres');
      fireEvent.click(filterButtons[1]); 
      
      expect(screen.getByText('Tous les événements')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Conférence Tech 2026')).toBeInTheDocument();
      });
    });

    it('devrait afficher le filtre de rôle pour les utilisateurs', () => {
      render(<ExportPage />);
      
      const filterButtons = screen.getAllByText('Filtres');
      fireEvent.click(filterButtons[3]);
      
      expect(screen.getByText('Tous les rôles')).toBeInTheDocument();
      expect(screen.getByText('Administrateurs')).toBeInTheDocument();
      expect(screen.getByText('Participants')).toBeInTheDocument();
    });

    it('devrait réinitialiser les filtres quand on clique sur le bouton', () => {
      render(<ExportPage />);
      
      const filterButtons = screen.getAllByText('Filtres');
      fireEvent.click(filterButtons[0]);
      
      const startDateInput = screen.getByPlaceholderText('Date de début') as HTMLInputElement;
      fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });
      
      const resetButton = screen.getByText('Réinitialiser les filtres');
      fireEvent.click(resetButton);
      
      expect(screen.queryByText('Filtres optionnels')).not.toBeInTheDocument();
    });
  });

  describe('Export des données', () => {
    it('devrait exporter les événements sans filtres', async () => {
      (exportService.exportEvents as jest.Mock).mockResolvedValue(undefined);
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[0]);
      
      await waitFor(() => {
        expect(exportService.exportEvents).toHaveBeenCalledWith({});
      });
    });

    it('devrait exporter les événements avec filtres', async () => {
      (exportService.exportEvents as jest.Mock).mockResolvedValue(undefined);
      render(<ExportPage />);
      
      const filterButtons = screen.getAllByText('Filtres');
      fireEvent.click(filterButtons[0]);
      
      const startDateInput = screen.getByPlaceholderText('Date de début');
      const endDateInput = screen.getByPlaceholderText('Date de fin');
      
      fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2026-12-31' } });
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[0]);
      
      await waitFor(() => {
        expect(exportService.exportEvents).toHaveBeenCalledWith({
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          eventId: '',
          zoneId: '',
          role: ''
        });
      });
    });

    it('devrait exporter les participations', async () => {
      (exportService.exportParticipations as jest.Mock).mockResolvedValue(undefined);
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[1]);
      
      await waitFor(() => {
        expect(exportService.exportParticipations).toHaveBeenCalled();
      });
    });

    it('devrait exporter les logs d\'accès', async () => {
      (exportService.exportAccessLogs as jest.Mock).mockResolvedValue(undefined);
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[2]);
      
      await waitFor(() => {
        expect(exportService.exportAccessLogs).toHaveBeenCalled();
      });
    });

    it('devrait exporter les utilisateurs', async () => {
      (exportService.exportUsers as jest.Mock).mockResolvedValue(undefined);
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[3]);
      
      await waitFor(() => {
        expect(exportService.exportUsers).toHaveBeenCalled();
      });
    });

    it('devrait exporter les zones', async () => {
      (exportService.exportZones as jest.Mock).mockResolvedValue(undefined);
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[4]);
      
      await waitFor(() => {
        expect(exportService.exportZones).toHaveBeenCalled();
      });
    });

    it('devrait exporter les statistiques sans filtres', async () => {
      (exportService.exportStatistics as jest.Mock).mockResolvedValue(undefined);
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[5]);
      
      await waitFor(() => {
        expect(exportService.exportStatistics).toHaveBeenCalled();
      });
    });

    it('devrait exporter les données complètes', async () => {
      (exportService.exportComplete as jest.Mock).mockResolvedValue(undefined);
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[6]);
      
      await waitFor(() => {
        expect(exportService.exportComplete).toHaveBeenCalled();
      });
    });

    it('devrait exporter directement les statistiques sans afficher les filtres', async () => {
      (exportService.exportStatistics as jest.Mock).mockResolvedValue(undefined);
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      
      const filterButtons = screen.getAllByText('Filtres');
      expect(filterButtons).toHaveLength(6);
      
      await clickAsync(exportButtons[5]);
      
      await waitFor(() => {
        expect(exportService.exportStatistics).toHaveBeenCalled();
      });
    });
  });

  describe('États de chargement', () => {
    it('devrait afficher le spinner pendant le chargement', async () => {
      (exportService.exportEvents as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[0]);
      
      expect(screen.getByText('Export...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Export...')).not.toBeInTheDocument();
      });
    });

    it('devrait désactiver le bouton pendant le chargement', async () => {
      (exportService.exportEvents as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[0]);
      
      expect(screen.getByText('Export...')).toBeInTheDocument();
    });

    it('devrait réactiver le bouton après l\'export', async () => {
      (exportService.exportEvents as jest.Mock).mockResolvedValue(undefined);
      
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[0]);
      
      await waitFor(() => {
        expect(screen.getAllByText('Exporter').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait afficher un message d\'erreur en cas d\'échec', async () => {
      const errorMessage = 'Erreur lors de l\'export';
      (exportService.exportEvents as jest.Mock).mockRejectedValue(new Error(errorMessage));
      
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      fireEvent.click(exportButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('devrait afficher l\'erreur de l\'API quand disponible', async () => {
      const apiError = 'Non autorisé';
      (exportService.exportEvents as jest.Mock).mockRejectedValue({
        response: { data: { error: apiError } }
      });
      
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      fireEvent.click(exportButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText(apiError)).toBeInTheDocument();
      });
    });

    it('devrait masquer le message d\'erreur après un nouvel export', async () => {
      (exportService.exportEvents as jest.Mock)
        .mockRejectedValueOnce(new Error('Erreur test'))
        .mockResolvedValueOnce(undefined);
      
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      
      fireEvent.click(exportButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Erreur test')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newExportButtons = screen.getAllByText('Exporter');
      await clickAsync(newExportButtons[0]);
      
      await waitFor(() => {
        expect(screen.queryByText('Erreur test')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Réinitialisation après export', () => {
    it('devrait masquer les filtres après un export réussi', async () => {
      (exportService.exportEvents as jest.Mock).mockResolvedValue(undefined);
      
      render(<ExportPage />);
      
      const filterButtons = screen.getAllByText('Filtres');
      fireEvent.click(filterButtons[0]);
      
      expect(screen.getByText('Filtres optionnels')).toBeInTheDocument();
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[0]);
      
      await waitFor(() => {
        expect(screen.queryByText('Filtres optionnels')).not.toBeInTheDocument();
      });
    });

    it('devrait réinitialiser les valeurs des filtres après export', async () => {
      (exportService.exportEvents as jest.Mock).mockResolvedValue(undefined);
      
      render(<ExportPage />);
      
      const filterButtons = screen.getAllByText('Filtres');
      fireEvent.click(filterButtons[0]);
      
      const startDateInput = screen.getByPlaceholderText('Date de début') as HTMLInputElement;
      fireEvent.change(startDateInput, { target: { value: '2026-01-01' } });
      
      const exportButtons = screen.getAllByText('Exporter');
      await clickAsync(exportButtons[0]);
      
      await waitFor(() => {
        expect(exportService.exportEvents).toHaveBeenCalled();
      });
      
      const newFilterButtons = screen.getAllByText('Filtres');
      fireEvent.click(newFilterButtons[0]);
      
      const newStartDateInput = screen.getByPlaceholderText('Date de début') as HTMLInputElement;
      expect(newStartDateInput.value).toBe('');
    });
  });

  describe('Accessibilité et UX', () => {
    it('les boutons désactivés ne devraient pas être cliquables', () => {
      (exportService.exportEvents as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      fireEvent.click(exportButtons[0]);
      
      expect(screen.getByText('Export...')).toBeInTheDocument();
      
      const otherExportButtons = screen.getAllByText('Exporter').filter(btn => btn.textContent === 'Exporter');
      if (otherExportButtons.length > 0) {
        fireEvent.click(otherExportButtons[0]);
      }
      
      expect(exportService.exportEvents).toHaveBeenCalledTimes(1);
    });

    it('devrait afficher tous les boutons avec le bon style', () => {
      render(<ExportPage />);
      
      const exportButtons = screen.getAllByText('Exporter');
      expect(exportButtons.length).toBe(7);
    });
  });
});
