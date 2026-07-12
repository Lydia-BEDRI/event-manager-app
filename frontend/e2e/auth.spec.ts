import { test, expect } from '@playwright/test';
import {
  mockLogin,
  mockParticipantDashboard,
  mockRegister,
  participantUser,
} from './fixtures';

test.beforeEach(async ({ page }) => {
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

  await page.route('**/api/notifications?limit=20', async (route) => {
    await route.fulfill({ json: [] });
  });
});

test('redirige un visiteur non connecté vers la page de connexion', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Bon retour parmi nous' })).toBeVisible();
});

test('connecte un participant et affiche son tableau de bord', async ({ page }) => {
  await mockLogin(page, participantUser);
  await mockParticipantDashboard(page);

  await page.goto('/login');
  await page.getByLabel('Adresse email').fill('participant@example.com');
  await page.getByLabel('Mot de passe').fill('Password123!');
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Mon espace participant' })).toBeVisible();
  await expect(page.getByText('Forum interne')).toBeVisible();
});

test('inscrit un nouvel utilisateur avec un mot de passe conforme', async ({ page }) => {
  await mockRegister(page);
  await mockParticipantDashboard(page);

  await page.goto('/register');
  await page.getByLabel('Prénom').fill('Nina');
  await page.getByLabel('Nom', { exact: true }).fill('Durand');
  await page.getByLabel('Adresse email').fill('new.user@example.com');
  await page.getByLabel('Mot de passe', { exact: true }).fill('Password123!');
  await page.getByLabel('Confirmer le mot de passe').fill('Password123!');
  await page.getByRole('button', { name: 'Créer mon compte' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Mon espace participant' })).toBeVisible();
});
