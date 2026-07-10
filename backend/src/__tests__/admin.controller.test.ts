import { Request, Response } from 'express';
import { getDashboardStats } from '../controllers/admin.controller';
import pool from '../config/database';

// Mock du module database
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Admin Controller - getDashboardStats', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnValue({ json: responseJson });
    
    mockRequest = {};
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };
    
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('devrait retourner les statistiques du dashboard avec succès', async () => {
      // Mock des résultats de base de données
      const mockEventStats = [{ 
        total_events: '5', 
        published_events: '2', 
        ongoing_events: '1',
        draft_events: '1',
        completed_events: '0',
        cancelled_events: '1',
        events_this_month: '2'
      }];

      const mockFillRateStats = [{ average_fill_rate: '45.50' }];
      const mockZonesPerEvent = [{ avg_zones_per_event: '3.2' }];
      const mockAttendanceByEvent: any[] = [];
      const mockParticipantStats = [{ 
        total_participants: '10',
        total_admins: '2',
        total_users: '8',
        new_this_month: '3'
      }];
      const mockApprovalRate = [{ 
        total_requests: '10',
        approved_count: '7',
        approval_rate: '70.00'
      }];
      const mockAvgParticipation = [{ avg_participants_per_event: '5.5' }];
      const mockAccessStats = [{ 
        total_scans: '100',
        scans_today: '10',
        valid_scans: '95',
        invalid_scans: '5'
      }];
      const mockAccessByZone: any[] = [];
      const mockPeakHours = [
        { hour: 8, scan_count: '15' },
        { hour: 12, scan_count: '30' },
        { hour: 14, scan_count: '25' }
      ];
      const mockAvgScansPerEvent = [{ avg_scans_per_event: '20.0' }];
      const mockZoneStats = [{ 
        total_zones: '15',
        total_capacity: '500',
        avg_capacity: '33'
      }];
      const mockTopZones = [
        { id: 1, name: 'Salle Principale', event_name: 'Event A', capacity: '100', unique_visitors: '75', total_visits: '120' },
        { id: 2, name: 'Workshop A', event_name: 'Event A', capacity: '50', unique_visitors: '45', total_visits: '60' }
      ];
      const mockZoneDistribution: any[] = [];
      const mockMessageStats = [{ 
        total_messages: '50',
        active_chat_users: '12',
        messages_today: '5',
        moderated_messages: '2'
      }];
      const mockActionsByType = [
        { action: 'LOGIN', count: '150' },
        { action: 'CREATE', count: '25' },
        { action: 'UPDATE', count: '40' }
      ];
      const mockActionsByAdmin: any[] = [];
      const mockNotificationStats: any[] = [];
      const mockNotificationSummary = [{ 
        total: '100',
        read_count: '80',
        unread_count: '20'
      }];
      const mockExportStats = [{ 
        total_exports: '10',
        completed_exports: '8',
        pending_exports: '1',
        processing_exports: '1',
        failed_exports: '0'
      }];
      const mockRecentExports: any[] = [];
      const mockParticipationRate = [{ global_participation_rate: '65.00' }];
      const mockAvgValidationTime = [{ avg_validation_hours: '24.5' }];
      const mockZoneFillRate = [{ avg_zone_fill_rate: '72.00' }];
      const mockParticipationStats = [{ 
        total_participations: '50',
        pending_participations: '5',
        approved_participations: '40',
        refused_participations: '5'
      }];
      const mockGlobalAttendanceRate = [{ attendance_rate: '85.00' }];
      const mockUpcomingEvents = [
        { 
          id: 1, 
          name: 'Event Futur', 
          start_date: new Date('2026-03-01'), 
          end_date: new Date('2026-03-02'),
          capacity: '100',
          location: 'Paris',
          status: 'PUBLISHED',
          participants_count: '30',
          approved_count: '25'
        }
      ];
      const mockRecentActivity = [
        { 
          id: 1, 
          action: 'LOGIN', 
          entity_type: 'user',
          created_at: new Date('2026-02-22T10:00:00'),
          first_name: 'Alice',
          last_name: 'Martin',
          email: 'alice@test.com'
        }
      ];
      const mockPendingRequests = [
        {
          id: 1,
          created_at: new Date('2026-02-22T09:00:00'),
          first_name: 'Bob',
          last_name: 'Dupont',
          email: 'bob@test.com',
          event_name: 'Event Test',
          event_id: 1
        }
      ];

      // Mock de toutes les requêtes dans l'ordre
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockEventStats])
        .mockResolvedValueOnce([mockFillRateStats])
        .mockResolvedValueOnce([mockZonesPerEvent])
        .mockResolvedValueOnce([mockAttendanceByEvent])
        .mockResolvedValueOnce([mockParticipantStats])
        .mockResolvedValueOnce([mockApprovalRate])
        .mockResolvedValueOnce([mockAvgParticipation])
        .mockResolvedValueOnce([mockAccessStats])
        .mockResolvedValueOnce([mockAccessByZone])
        .mockResolvedValueOnce([mockPeakHours])
        .mockResolvedValueOnce([mockAvgScansPerEvent])
        .mockResolvedValueOnce([mockZoneStats])
        .mockResolvedValueOnce([mockTopZones])
        .mockResolvedValueOnce([mockZoneDistribution])
        .mockResolvedValueOnce([mockMessageStats])
        .mockResolvedValueOnce([mockActionsByType])
        .mockResolvedValueOnce([mockActionsByAdmin])
        .mockResolvedValueOnce([mockNotificationStats])
        .mockResolvedValueOnce([mockNotificationSummary])
        .mockResolvedValueOnce([mockExportStats])
        .mockResolvedValueOnce([mockRecentExports])
        .mockResolvedValueOnce([mockParticipationRate])
        .mockResolvedValueOnce([mockAvgValidationTime])
        .mockResolvedValueOnce([mockZoneFillRate])
        .mockResolvedValueOnce([mockParticipationStats])
        .mockResolvedValueOnce([mockGlobalAttendanceRate])
        .mockResolvedValueOnce([mockUpcomingEvents])
        .mockResolvedValueOnce([mockRecentActivity])
        .mockResolvedValueOnce([mockPendingRequests]);

      await getDashboardStats(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalled();

      const responseData = responseJson.mock.calls[0][0];

      // Vérifier que les nombres sont convertis
      expect(typeof responseData.events.total_events).toBe('number');
      expect(responseData.events.total_events).toBe(5);
      expect(responseData.events.published_events).toBe(2);
      
      // Vérifier les structures principales
      expect(responseData).toHaveProperty('events');
      expect(responseData).toHaveProperty('participants');
      expect(responseData).toHaveProperty('access');
      expect(responseData).toHaveProperty('zones');
      expect(responseData).toHaveProperty('messages');
      expect(responseData).toHaveProperty('notifications');
      expect(responseData).toHaveProperty('exports');
      expect(responseData).toHaveProperty('kpis');
      expect(responseData).toHaveProperty('upcomingEvents');
      expect(responseData).toHaveProperty('recentActivity');
      expect(responseData).toHaveProperty('pendingRequests');
    });

    it('devrait gérer les erreurs de base de données', async () => {
      const mockError = new Error('Database connection error');
      (pool.query as jest.Mock).mockRejectedValueOnce(mockError);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await getDashboardStats(mockRequest as Request, mockResponse as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Erreur lors de la récupération des statistiques:',
        mockError
      );
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        message: 'Une erreur interne est survenue.'
      });

      consoleErrorSpy.mockRestore();
    });

    it('devrait convertir correctement les strings en nombres avec parseNumbers', async () => {
      const mockEventStats = [{ 
        total_events: '5', 
        published_events: '2',
        ongoing_events: '1',
        draft_events: '1',
        completed_events: '0',
        cancelled_events: '1',
        events_this_month: '2'
      }];

      // Mock minimal pour tester la conversion
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([mockEventStats])
        .mockResolvedValueOnce([[{ average_fill_rate: '0' }]])
        .mockResolvedValueOnce([[{ avg_zones_per_event: '0' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total_participants: '0', total_admins: '0', total_users: '0', new_this_month: '0' }]])
        .mockResolvedValueOnce([[{ total_requests: '0', approved_count: '0', approval_rate: '0' }]])
        .mockResolvedValueOnce([[{ avg_participants_per_event: '0' }]])
        .mockResolvedValueOnce([[{ total_scans: '0', scans_today: '0', valid_scans: '0', invalid_scans: '0' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ avg_scans_per_event: '0' }]])
        .mockResolvedValueOnce([[{ total_zones: '0', total_capacity: '0', avg_capacity: '0' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total_messages: '0', active_chat_users: '0', messages_today: '0', moderated_messages: '0' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total: '0', read_count: '0', unread_count: '0' }]])
        .mockResolvedValueOnce([[{ total_exports: '0', completed_exports: '0', pending_exports: '0', processing_exports: '0', failed_exports: '0' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ global_participation_rate: '0' }]])
        .mockResolvedValueOnce([[{ avg_validation_hours: '0' }]])
        .mockResolvedValueOnce([[{ avg_zone_fill_rate: '0' }]])
        .mockResolvedValueOnce([[{ total_participations: '0', pending_participations: '0', approved_participations: '0', refused_participations: '0' }]])
        .mockResolvedValueOnce([[{ attendance_rate: '0' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      await getDashboardStats(mockRequest as Request, mockResponse as Response);

      const responseData = responseJson.mock.calls[0][0];
      
      // Vérifier que les valeurs string sont converties en nombre
      expect(typeof responseData.events.total_events).toBe('number');
      expect(typeof responseData.events.published_events).toBe('number');
      expect(responseData.events.total_events).toBe(5);
      expect(responseData.events.published_events).toBe(2);
    });

    it('devrait préserver les objets Date lors de la conversion', async () => {
      const testDate = new Date('2026-03-01T10:00:00');
      const mockUpcomingEvents = [
        { 
          id: 1, 
          name: 'Event Test',
          start_date: testDate,
          end_date: testDate,
          capacity: '100',
          location: 'Paris',
          status: 'PUBLISHED',
          participants_count: '10',
          approved_count: '8'
        }
      ];

      // Mock toutes les requêtes avec des valeurs par défaut et l'événement avec date
      (pool.query as jest.Mock)
        .mockResolvedValueOnce([[{ total_events: '0', published_events: '0', ongoing_events: '0', draft_events: '0', completed_events: '0', cancelled_events: '0', events_this_month: '0' }]])
        .mockResolvedValueOnce([[{ average_fill_rate: '0' }]])
        .mockResolvedValueOnce([[{ avg_zones_per_event: '0' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total_participants: '0', total_admins: '0', total_users: '0', new_this_month: '0' }]])
        .mockResolvedValueOnce([[{ total_requests: '0', approved_count: '0', approval_rate: '0' }]])
        .mockResolvedValueOnce([[{ avg_participants_per_event: '0' }]])
        .mockResolvedValueOnce([[{ total_scans: '0', scans_today: '0', valid_scans: '0', invalid_scans: '0' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ avg_scans_per_event: '0' }]])
        .mockResolvedValueOnce([[{ total_zones: '0', total_capacity: '0', avg_capacity: '0' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total_messages: '0', active_chat_users: '0', messages_today: '0', moderated_messages: '0' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ total: '0', read_count: '0', unread_count: '0' }]])
        .mockResolvedValueOnce([[{ total_exports: '0', completed_exports: '0', pending_exports: '0', processing_exports: '0', failed_exports: '0' }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[{ global_participation_rate: '0' }]])
        .mockResolvedValueOnce([[{ avg_validation_hours: '0' }]])
        .mockResolvedValueOnce([[{ avg_zone_fill_rate: '0' }]])
        .mockResolvedValueOnce([[{ total_participations: '0', pending_participations: '0', approved_participations: '0', refused_participations: '0' }]])
        .mockResolvedValueOnce([[{ attendance_rate: '0' }]])
        .mockResolvedValueOnce([mockUpcomingEvents])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      await getDashboardStats(mockRequest as Request, mockResponse as Response);

      const responseData = responseJson.mock.calls[0][0];
      
      // Vérifier que les dates sont préservées
      expect(responseData.upcomingEvents[0].start_date).toBeInstanceOf(Date);
      expect(responseData.upcomingEvents[0].start_date.getTime()).toBe(testDate.getTime());
    });
  });
});
