/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../AdminDashboard';
import { adminService } from '../../../services/admin.service';
import { useAuth } from '../../../contexts/AuthContext';

// Mock des modules
jest.mock('../../../services/admin.service');
jest.mock('../../../contexts/AuthContext');

// Mock de recharts pour éviter les erreurs de SVG
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('AdminDashboard', () => {
  const mockAccessToken = 'mock-access-token';

  const mockStats = {
    events: {
      total_events: 511,
      published_events: 203,
      ongoing_events: 107,
      draft_events: 104,
      completed_events: 0,
      cancelled_events: 109,
      events_this_month: 202,
      average_fill_rate: 45.5,
      avg_zones_per_event: 3.2
    },
    attendanceByEvent: [
      {
        id: 1,
        name: 'Conférence Tech 2026',
        status: 'ONGOING',
        total_approved: 501,
        attended: 451,
        attendance_rate: 90
      }
    ],
    participants: {
      total_participants: 1001,
      total_admins: 53,
      total_users: 951,
      new_this_month: 103,
      approval_rate: 80,
      avg_participants_per_event: 251
    },
    approvalStats: {
      total_requests: 1003,
      approved_count: 803,
      approval_rate: 80
    },
    participations: {
      total_participations: 1005,
      pending_participations: 105,
      approved_participations: 805,
      refused_participations: 106
    },
    access: {
      total_scans: 10001,
      scans_today: 502,
      valid_scans: 9501,
      invalid_scans: 503,
      avg_scans_per_event: 2001
    },
    accessByZone: [],
    peakHours: [
      { hour: 8, scan_count: 1001 },
      { hour: 12, scan_count: 2501 },
      { hour: 14, scan_count: 2002 }
    ],
    zones: {
      total_zones: 151,
      total_capacity: 5001,
      avg_capacity: 331
    },
    topZones: [
      {
        id: 1,
        name: 'Salle Principale',
        event_name: 'Event A',
        capacity: 1002,
        unique_visitors: 751,
        total_visits: 1201
      },
      {
        id: 2,
        name: 'Workshop A',
        event_name: 'Event A',
        capacity: 504,
        unique_visitors: 452,
        total_visits: 601
      }
    ],
    zoneDistribution: [],
    messages: {
      total_messages: 5001,
      active_chat_users: 505,
      messages_today: 252,
      moderated_messages: 102
    },
    actionsByType: [
      { action: 'LOGIN', count: 5002 },
      { action: 'CREATE', count: 1003 },
      { action: 'UPDATE', count: 2003 },
      { action: 'APPROVE_PARTICIPATION', count: 802 }
    ],
    actionsByAdmin: [],
    notifications: {
      total: 10002,
      read_count: 8001,
      unread_count: 2004,
      byType: []
    },
    exports: {
      total_exports: 506,
      completed_exports: 453,
      pending_exports: 204,
      processing_exports: 205,
      failed_exports: 108,
      recent: []
    },
    kpis: {
      global_participation_rate: 65,
      avg_validation_hours: 24,
      avg_zone_fill_rate: 72,
      attendance_rate: 85
    },
    upcomingEvents: [
      {
        id: 1,
        name: 'Event Futur',
        start_date: '2026-03-01T10:00:00.000Z',
        end_date: '2026-03-02T10:00:00.000Z',
        capacity: 1004,
        location: 'Paris',
        status: 'PUBLISHED',
        participants_count: 301,
        approved_count: 253
      }
    ],
    recentActivity: [
      {
        id: 1,
        action: 'LOGIN',
        entity_type: 'user',
        created_at: '2026-02-22T10:00:00.000Z',
        first_name: 'Alice',
        last_name: 'Martin',
        email: 'alice@test.com'
      },
      {
        id: 2,
        action: 'CREATE',
        entity_type: 'event',
        created_at: '2026-02-22T09:30:00.000Z',
        first_name: 'Bob',
        last_name: 'Dupont',
        email: 'bob@test.com'
      }
    ],
    pendingRequests: [
      {
        id: 1,
        created_at: '2026-02-22T09:00:00.000Z',
        first_name: 'Charlie',
        last_name: 'Brown',
        email: 'charlie@test.com',
        event_name: 'Event Test',
        event_id: 1
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      accessToken: mockAccessToken,
      user: { id: 1, email: 'admin@test.com', role: 'ADMIN' }
    });
  });

  it('devrait afficher le loader pendant le chargement', () => {
    (adminService.getDashboardStats as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Ne résout jamais
    );

    render(<AdminDashboard />);

    expect(screen.getByText('Chargement des statistiques...')).toBeInTheDocument();
  });

  it('devrait afficher les statistiques après le chargement', async () => {
    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tableau de bord Administrateur')).toBeInTheDocument();
    });

    // Vérifier les StatCards principaux
    expect(screen.getByText('Événements actifs')).toBeInTheDocument();
    expect(screen.getByText('Total participants')).toBeInTheDocument();
    expect(screen.getByText('Présences validées')).toBeInTheDocument();
    expect(screen.getByText('Taux de présence')).toBeInTheDocument();

    // Vérifier les valeurs
    expect(screen.getByText('203')).toBeInTheDocument(); // published_events
    expect(screen.getByText('951')).toBeInTheDocument(); // total_users
    expect(screen.getByText('9501')).toBeInTheDocument(); // valid_scans
    expect(screen.getByText('85%')).toBeInTheDocument(); // attendance_rate
  });

  it('devrait afficher une erreur en cas d\'échec du chargement', async () => {
    const errorMessage = 'Erreur de connexion';
    (adminService.getDashboardStats as jest.Mock).mockRejectedValueOnce({
      error: errorMessage
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('devrait afficher les graphiques avec les données', async () => {
    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Événements par statut')).toBeInTheDocument();
    });

    expect(screen.getByText('Participations par statut')).toBeInTheDocument();
    expect(screen.getByText('Pics d\'affluence')).toBeInTheDocument();
    expect(screen.getByText('Zones les plus fréquentées')).toBeInTheDocument();
    expect(screen.getByText('Actions système')).toBeInTheDocument();
  });

  it('devrait afficher les KPI cards avec les bonnes valeurs', async () => {
    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Taux de remplissage')).toBeInTheDocument();
    });

    expect(screen.getByText('46%')).toBeInTheDocument(); // Math.round(45.5)
    expect(screen.getByText('Temps de validation')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();
    expect(screen.getByText('Remplissage zones')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('Taux d\'approbation')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('devrait afficher les prochains événements', async () => {
    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Prochains événements')).toBeInTheDocument();
    });

    expect(screen.getByText('Event Futur')).toBeInTheDocument();
    expect(screen.getByText(/Paris/)).toBeInTheDocument();
    expect(screen.getByText('253 / 1004 participants')).toBeInTheDocument();
    expect(screen.getByText('25% rempli')).toBeInTheDocument();
  });

  it('devrait afficher l\'activité récente', async () => {
    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Activité récente')).toBeInTheDocument();
    });

    // Vérifier que les actions sont traduites en français
    expect(screen.getByText(/Connexion/)).toBeInTheDocument();
    expect(screen.getByText(/Création/)).toBeInTheDocument();
    expect(screen.getByText('Alice Martin')).toBeInTheDocument();
    expect(screen.getByText('Bob Dupont')).toBeInTheDocument();
  });

  it('devrait afficher les demandes en attente', async () => {
    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1 demande en attente')).toBeInTheDocument();
    });

    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    expect(screen.getByText(/Event Test/)).toBeInTheDocument();
    expect(screen.getByText('Traiter')).toBeInTheDocument();
  });

  it('devrait afficher les statistiques de notifications', async () => {
    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    expect(screen.getByText('10002')).toBeInTheDocument(); // total
    expect(screen.getByText('8001')).toBeInTheDocument(); // read_count
    expect(screen.getByText('2004')).toBeInTheDocument(); // unread_count
  });

  it('devrait afficher les statistiques de messages', async () => {
    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    expect(screen.getByText('5001')).toBeInTheDocument(); // total_messages
    expect(screen.getByText('505')).toBeInTheDocument(); // active_chat_users
    expect(screen.getByText('252')).toBeInTheDocument(); // messages_today
  });

  it('devrait afficher les statistiques d\'exports CSV', async () => {
    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Exports CSV')).toBeInTheDocument();
    });

    expect(screen.getByText('453')).toBeInTheDocument(); // completed_exports
    expect(screen.getByText('205')).toBeInTheDocument(); // processing_exports
    expect(screen.getByText('108')).toBeInTheDocument(); // failed_exports
  });

  it('devrait afficher le tableau des taux de présence par événement', async () => {
    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(mockStats);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Taux de présence par événement')).toBeInTheDocument();
    });

    expect(screen.getByText('Conférence Tech 2026')).toBeInTheDocument();
    expect(screen.getByText('451')).toBeInTheDocument(); // attended
    expect(screen.getByText('90%')).toBeInTheDocument(); // attendance_rate
  });

  it('ne devrait pas afficher les statistiques sans token d\'accès', () => {
    (useAuth as jest.Mock).mockReturnValue({
      accessToken: null,
      user: null
    });

    render(<AdminDashboard />);

    // Le composant ne devrait rien afficher ou rester en chargement
    expect(screen.queryByText('Tableau de bord Administrateur')).not.toBeInTheDocument();
  });

  it('devrait afficher un message quand il n\'y a pas d\'événements à venir', async () => {
    const statsWithoutEvents = {
      ...mockStats,
      upcomingEvents: []
    };

    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(statsWithoutEvents);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Aucun événement à venir')).toBeInTheDocument();
    });
  });

  it('devrait afficher un message quand il n\'y a pas d\'activité récente', async () => {
    const statsWithoutActivity = {
      ...mockStats,
      recentActivity: []
    };

    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(statsWithoutActivity);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Aucune activité récente')).toBeInTheDocument();
    });
  });

  it('devrait masquer le tableau de présence quand il n\'y a pas de données', async () => {
    const statsWithoutAttendance = {
      ...mockStats,
      attendanceByEvent: []
    };

    (adminService.getDashboardStats as jest.Mock).mockResolvedValueOnce(statsWithoutAttendance);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Tableau de bord Administrateur')).toBeInTheDocument();
    });

    expect(screen.queryByText('Taux de présence par événement')).not.toBeInTheDocument();
  });
});
