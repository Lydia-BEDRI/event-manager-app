/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import { adminService } from '../admin.service';
import { api } from '../api';

jest.mock('../api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Admin Service', () => {
  const mockAccessToken = 'mock-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('devrait récupérer les statistiques du dashboard avec succès', async () => {
      const mockStats = {
        events: {
          total_events: 5,
          published_events: 2,
          ongoing_events: 1,
          draft_events: 1,
          completed_events: 0,
          cancelled_events: 1,
          events_this_month: 2,
          average_fill_rate: 45.5,
          avg_zones_per_event: 3.2
        },
        attendanceByEvent: [
          {
            id: 1,
            name: 'Event Test',
            status: 'ONGOING',
            total_approved: 50,
            attended: 45,
            attendance_rate: 90
          }
        ],
        participants: {
          total_participants: 100,
          total_admins: 5,
          total_users: 95,
          new_this_month: 10,
          approval_rate: 80,
          avg_participants_per_event: 25
        },
        approvalStats: {
          total_requests: 100,
          approved_count: 80,
          approval_rate: 80
        },
        participations: {
          total_participations: 100,
          pending_participations: 10,
          approved_participations: 80,
          refused_participations: 10
        },
        access: {
          total_scans: 1000,
          scans_today: 50,
          valid_scans: 950,
          invalid_scans: 50,
          avg_scans_per_event: 200
        },
        accessByZone: [],
        peakHours: [
          { hour: 8, scan_count: 100 },
          { hour: 12, scan_count: 250 },
          { hour: 14, scan_count: 200 }
        ],
        zones: {
          total_zones: 15,
          total_capacity: 500,
          avg_capacity: 33
        },
        topZones: [
          {
            id: 1,
            name: 'Salle Principale',
            event_name: 'Event A',
            capacity: 100,
            unique_visitors: 75,
            total_visits: 120
          }
        ],
        zoneDistribution: [],
        messages: {
          total_messages: 500,
          active_chat_users: 50,
          messages_today: 25,
          moderated_messages: 10
        },
        actionsByType: [
          { action: 'LOGIN', count: 500 },
          { action: 'CREATE', count: 100 },
          { action: 'UPDATE', count: 200 }
        ],
        actionsByAdmin: [],
        notifications: {
          total: 1000,
          read_count: 800,
          unread_count: 200,
          byType: []
        },
        exports: {
          total_exports: 50,
          completed_exports: 45,
          pending_exports: 2,
          processing_exports: 2,
          failed_exports: 1,
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
            capacity: 100,
            location: 'Paris',
            status: 'PUBLISHED',
            participants_count: 30,
            approved_count: 25
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
          }
        ],
        pendingRequests: [
          {
            id: 1,
            created_at: '2026-02-22T09:00:00.000Z',
            first_name: 'Bob',
            last_name: 'Dupont',
            email: 'bob@test.com',
            event_name: 'Event Test',
            event_id: 1
          }
        ]
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockStats);

      const result = await adminService.getDashboardStats(mockAccessToken);

      expect(api.get).toHaveBeenCalledWith('/admin/dashboard-stats', mockAccessToken);

      expect(result).toEqual(mockStats);
      expect(result.events.total_events).toBe(5);
      expect(result.participants.total_users).toBe(95);
      expect(result.kpis.attendance_rate).toBe(85);
    });

    it('devrait gérer les erreurs API correctement', async () => {
      const mockError = {
        status: 401,
        error: 'Accès non autorisé'
      };

      (api.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(adminService.getDashboardStats(mockAccessToken)).rejects.toEqual(mockError);
    });

    it('devrait gérer les erreurs réseau', async () => {
      const mockError = new Error('Network Error');

      (api.get as jest.Mock).mockRejectedValueOnce(mockError);

      await expect(adminService.getDashboardStats(mockAccessToken)).rejects.toThrow('Network Error');
    });

    it('devrait envoyer le token d\'authentification dans les headers', async () => {
      const mockStats = {
        events: { total_events: 0 },
        participants: { total_users: 0 },
        access: { total_scans: 0 },
        zones: { total_zones: 0 },
        messages: { total_messages: 0 },
        notifications: { total: 0 },
        exports: { total_exports: 0 },
        kpis: { attendance_rate: 0 },
        attendanceByEvent: [],
        approvalStats: {},
        participations: {},
        accessByZone: [],
        peakHours: [],
        topZones: [],
        zoneDistribution: [],
        actionsByType: [],
        actionsByAdmin: [],
        upcomingEvents: [],
        recentActivity: [],
        pendingRequests: []
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockStats);

      await adminService.getDashboardStats(mockAccessToken);

      expect(api.get).toHaveBeenCalledWith(
        '/admin/dashboard-stats',
        mockAccessToken
      );
    });
  });
});
