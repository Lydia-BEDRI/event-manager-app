import { defineConfig, devices } from '@playwright/test';

const frontendUrl = process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:3000';
const backendUrl = process.env.E2E_BACKEND_URL || 'http://127.0.0.1:5000';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: frontendUrl,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  expect: {
    timeout: 10_000,
  },
  timeout: 45_000,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm --prefix ../backend run dev',
      url: `${backendUrl}/health`,
      name: 'API',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '5000',
        FRONTEND_URL: frontendUrl,
        CORS_ORIGIN: frontendUrl,
        JWT_SECRET: process.env.JWT_SECRET || 'e2e-jwt-secret-change-me',
        QR_CODE_PRIVATE_KEY: process.env.QR_CODE_PRIVATE_KEY || 'e2e-qr-private-key-change-me',
      },
    },
    {
      command: 'npm start',
      url: frontendUrl,
      name: 'Frontend',
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        ...process.env,
        BROWSER: 'none',
        PORT: '3000',
        REACT_APP_API_URL: `${backendUrl}/api`,
      },
    },
  ],
});
