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

export async function mockAuthenticatedUser(page: Page, user = participantUser) {
  await page.addInitScript(() => {
    window.localStorage.setItem('accessToken', 'e2e-access-token');
    window.localStorage.setItem('refreshToken', 'e2e-refresh-token');
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
        refreshToken: 'e2e-refresh-token',
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
        refreshToken: 'e2e-refresh-token',
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
        refreshToken: 'e2e-refresh-token',
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
            start_date: '2026-09-10T09:00:00.000Z',
          },
        ],
        upcomingEvents: [],
        pastEvents: [],
      },
    });
  });
}
