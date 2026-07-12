import { test, expect } from '@playwright/test';
import {
  adminUser,
  mockAdminDashboard,
  mockAuthenticatedUser,
  mockCookieConsent,
  mockNotifications,
  mockParticipantDashboard,
  mockParticipationRequest,
  participantUser,
} from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockCookieConsent(page);
  await mockNotifications(page);
});

test('redirige un participant hors des pages réservées aux administrateurs', async ({ page }) => {
  await mockAuthenticatedUser(page, participantUser);
  await mockParticipantDashboard(page);

  await page.goto('/events');

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Mon espace participant' })).toBeVisible();
});

test('affiche le tableau de bord administrateur avec ses indicateurs principaux', async ({ page }) => {
  await mockAuthenticatedUser(page, adminUser);
  await mockAdminDashboard(page);

  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: 'Tableau de bord Administrateur' })).toBeVisible();
  await expect(page.getByText('Événements actifs')).toBeVisible();
  await expect(page.getByText('Total participants')).toBeVisible();
  await expect(page.getByText('Taux de présence')).toBeVisible();
});

test('filtre les événements disponibles pour un participant', async ({ page }) => {
  await mockAuthenticatedUser(page, participantUser);
  await mockParticipantDashboard(page);

  await page.goto('/available-events');
  await page.getByLabel('Rechercher un événement disponible').fill('forum');

  await expect(page.getByRole('heading', { name: 'Événements disponibles' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Forum interne' })).toBeVisible();

  await page.getByLabel('Rechercher un événement disponible').fill('inexistant');

  await expect(page.getByText('Aucun événement disponible pour le moment.')).toBeVisible();
});

test('envoie une demande de participation depuis les événements disponibles', async ({ page }) => {
  await mockAuthenticatedUser(page, participantUser);
  await mockParticipantDashboard(page);
  await mockParticipationRequest(page);

  await page.goto('/available-events');
  await page.getByRole('button', { name: "S'inscrire" }).click();

  await expect(page.getByRole('status')).toContainText('Demande de participation envoyée');
});
