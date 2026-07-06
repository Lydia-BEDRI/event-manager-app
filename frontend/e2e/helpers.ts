import { APIRequestContext, APIResponse, Page } from '@playwright/test';

export const API_URL = process.env.E2E_BACKEND_URL || 'http://127.0.0.1:5000';
export const TEST_PASSWORD = 'Test@12345678';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toMySqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export async function expectApiSuccess(response: APIResponse): Promise<void> {
  if (!response.ok()) {
    throw new Error(`API ${response.status()} ${response.statusText()}: ${await response.text()}`);
  }
}

export async function loginApi(
  request: APIRequestContext,
  email: string,
  password = TEST_PASSWORD,
): Promise<AuthTokens> {
  const response = await request.post(`${API_URL}/api/auth/login`, {
    data: { email, password },
  });
  await expectApiSuccess(response);
  const body = await response.json();
  return { accessToken: body.accessToken, refreshToken: body.refreshToken };
}

export async function registerParticipant(
  request: APIRequestContext,
  email: string,
): Promise<AuthTokens> {
  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: {
      firstName: 'Test',
      lastName: 'E2E',
      email,
      password: TEST_PASSWORD,
    },
  });
  await expectApiSuccess(response);
  const body = await response.json();
  return { accessToken: body.accessToken, refreshToken: body.refreshToken };
}

export async function authenticatePage(page: Page, tokens: AuthTokens): Promise<void> {
  await page.addInitScript((auth) => {
    window.localStorage.setItem('accessToken', auth.accessToken);
    window.localStorage.setItem('refreshToken', auth.refreshToken);
    window.localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString(),
    }));
  }, tokens);
}

export async function dismissCookies(page: Page): Promise<void> {
  const rejectButton = page.getByRole('button', { name: 'Tout refuser' });
  if (await rejectButton.isVisible().catch(() => false)) {
    await rejectButton.click();
  }
}

export async function createEvent(
  request: APIRequestContext,
  adminToken: string,
  options: { withZone?: boolean } = {},
) {
  const name = unique('Événement E2E');
  const zoneName = unique('Zone E2E');
  const start = new Date();
  start.setUTCFullYear(start.getUTCFullYear() + 1);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const response = await request.post(`${API_URL}/api/events`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: {
      name,
      description: 'Événement créé automatiquement par Playwright',
      location: 'Paris E2E',
      start_date: toMySqlDateTime(start),
      end_date: toMySqlDateTime(end),
      capacity: 20,
      status: 'PUBLISHED',
      zones: options.withZone
        ? [{ name: zoneName, description: 'Zone de contrôle E2E', capacity: 20 }]
        : [],
    },
  });
  await expectApiSuccess(response);
  return response.json();
}
