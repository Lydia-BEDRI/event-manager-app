import { Page, expect } from '@playwright/test';

export const participantUser = {
  id: 12,
  email: 'participant@example.com',
  firstName: 'Alice',
  lastName: 'Martin',
  role: 'PARTICIPANT',
};

export const adminUser = {
  id: 1,
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'Event',
  role: 'ADMIN',
};

export async function mockCookieConsent(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'cookiePreferences',
      JSON.stringify({
        essential: true,
        functional: false,
        analytics: false,
        timestamp: new Date().toISOString(),
      }),
    );
  });
}

export async function mockNotifications(page: Page) {
  await page.route('**/api/notifications?limit=20', async (route) => {
    await route.fulfill({ json: [] });
  });
}

export async function mockAuthenticatedUser(page: Page, user = participantUser) {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'e2e-access-token');
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ json: { user } });
  });
}

export async function mockLogin(page: Page, user = participantUser) {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      json: {
        message: 'Connexion réussie',
        user,
        accessToken: 'e2e-access-token',
      },
    });
  });
}

export async function mockTwoFactorLogin(page: Page, user = participantUser) {
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      json: {
        message: 'Code de vérification requis',
        requiresTwoFactor: true,
        challengeToken: 'e2e-2fa-challenge',
      },
    });
  });

  await page.route('**/api/auth/2fa/login/verify', async (route) => {
    const requestBody = route.request().postDataJSON();
    await expect(requestBody).toMatchObject({
      challengeToken: 'e2e-2fa-challenge',
      code: '123456',
    });

    await route.fulfill({
      json: {
        message: 'Connexion réussie',
        user,
        accessToken: 'e2e-access-token',
      },
    });
  });
}

export async function mockRegister(page: Page) {
  await page.route('**/api/auth/register', async (route) => {
    const requestBody = route.request().postDataJSON();
    await expect(requestBody.email).toBe('new.user@example.com');

    await route.fulfill({
      json: {
        message: 'Inscription réussie',
        user: {
          ...participantUser,
          id: 42,
          email: requestBody.email,
          firstName: requestBody.firstName,
          lastName: requestBody.lastName,
        },
        accessToken: 'e2e-access-token',
      },
    });
  });
}

export async function mockForgotPassword(page: Page) {
  await page.route('**/api/auth/forgot-password', async (route) => {
    const requestBody = route.request().postDataJSON();
    await expect(requestBody.email).toBe('participant@example.com');

    await route.fulfill({
      json: {
        message: 'Email de réinitialisation envoyé',
      },
    });
  });
}

export async function mockParticipantDashboard(page: Page) {
  await page.route('**/api/participations/my-stats', async (route) => {
    await route.fulfill({
      json: {
        stats: {
          total_participations: 1,
          approved_participations: 1,
          pending_participations: 0,
        },
        zoneAccess: {
          unique_zones_visited: 0,
          total_zone_accesses: 0,
        },
        myParticipations: [],
        availableEvents: [
          {
            id: 8,
            name: 'Forum interne',
            description: 'Une journée pour rencontrer les équipes produit.',
            start_date: '2026-09-10T09:00:00.000Z',
            location: 'Paris',
            capacity: 120,
            current_participants: 42,
          },
        ],
        upcomingEvents: [],
        pastEvents: [],
      },
    });
  });
}

export async function mockParticipationRequest(page: Page) {
  await page.route('**/api/participations/events/8/request', async (route) => {
    await route.fulfill({
      json: {
        id: 99,
        event_id: 8,
        status: 'PENDING',
      },
    });
  });
}

export async function mockAdminDashboard(page: Page) {
  await page.route('**/api/admin/dashboard-stats', async (route) => {
    await route.fulfill({
      json: {
        events: {
          total_events: 5,
          published_events: 3,
          ongoing_events: 1,
          draft_events: 1,
          completed_events: 0,
          cancelled_events: 0,
          events_this_month: 2,
          average_fill_rate: 63,
          avg_zones_per_event: 2,
        },
        attendanceByEvent: [],
        participants: {
          total_participants: 42,
          total_admins: 2,
          total_users: 44,
          new_this_month: 6,
          approval_rate: 85,
          avg_participants_per_event: 14,
        },
        approvalStats: {
          total_requests: 18,
          approved_count: 15,
          approval_rate: 83,
        },
        participations: {
          total_participations: 18,
          pending_participations: 3,
          approved_participations: 15,
          refused_participations: 0,
        },
        access: {
          total_scans: 30,
          scans_today: 4,
          valid_scans: 28,
          invalid_scans: 2,
          avg_scans_per_event: 10,
        },
        accessByZone: [],
        peakHours: [],
        zones: {
          total_zones: 4,
          total_capacity: 250,
          avg_capacity: 62,
        },
        topZones: [],
        zoneDistribution: [],
        messages: {
          total_messages: 12,
          active_chat_users: 5,
          messages_today: 2,
          moderated_messages: 0,
        },
        actionsByType: [],
        actionsByAdmin: [],
        notifications: {
          total: 0,
          read_count: 0,
          unread_count: 0,
          byType: [],
        },
        exports: {
          total_exports: 1,
          completed_exports: 1,
          pending_exports: 0,
          processing_exports: 0,
          failed_exports: 0,
          recent: [],
        },
        kpis: {
          global_participation_rate: 75,
          avg_validation_hours: 6,
          avg_zone_fill_rate: 60,
          attendance_rate: 78,
        },
        upcomingEvents: [
          {
            id: 8,
            name: 'Forum interne',
            start_date: '2026-09-10T09:00:00.000Z',
            end_date: '2026-09-10T17:00:00.000Z',
            capacity: 120,
            location: 'Paris',
            status: 'PUBLISHED',
            participants_count: 42,
            approved_count: 38,
          },
        ],
        recentActivity: [],
        pendingRequests: [],
      },
    });
  });
}
