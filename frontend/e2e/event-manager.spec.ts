import { expect, test } from '@playwright/test';
import {
  API_URL,
  TEST_PASSWORD,
  authenticatePage,
  createEvent,
  dismissCookies,
  expectApiSuccess,
  loginApi,
  registerParticipant,
  unique,
} from './helpers';

test.describe('Parcours métier stables', () => {
  test('un visiteur peut créer un compte participant', async ({ page }) => {
    const email = `${unique('participant')}@example.test`;
    await page.goto('/register');
    await dismissCookies(page);

    await page.getByLabel('Prénom', { exact: true }).fill('Camille');
    await page.getByLabel('Nom', { exact: true }).fill('E2E');
    await page.getByLabel('Adresse email', { exact: true }).fill(email);
    await page.getByLabel('Mot de passe', { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel('Confirmer le mot de passe').fill(TEST_PASSWORD);
    const [registrationResponse] = await Promise.all([
      page.waitForResponse((response) => response.url().endsWith('/api/auth/register')),
      page.getByRole('button', { name: 'Créer mon compte' }).click(),
    ]);
    if (!registrationResponse.ok()) {
      throw new Error(
        `Inscription refusée (${registrationResponse.status()}): ${await registrationResponse.text()}`,
      );
    }

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Mon espace participant' })).toBeVisible();
  });

  test('un administrateur peut se connecter', async ({ page }) => {
    await page.goto('/login');
    await dismissCookies(page);
    await page.getByLabel('Adresse email').fill('admin@eventmanager.fr');
    await page.getByLabel('Mot de passe').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Tableau de bord administrateur/i })).toBeVisible();
  });

  test('le formulaire de mot de passe oublié ne révèle pas si le compte existe', async ({ page }) => {
    const unknownEmail = `${unique('inconnu')}@example.test`;
    await page.goto('/forgot-password');
    await dismissCookies(page);
    await page.getByLabel('Adresse email').fill(unknownEmail);
    await page.getByRole('button', { name: 'Envoyer le lien' }).click();

    await expect(page.getByRole('heading', { name: 'Email envoyé' })).toBeVisible();
    await expect(page.getByText(/Si un compte existe/)).toContainText(unknownEmail);
  });

  test('un administrateur peut créer un événement', async ({ page, request }) => {
    const adminTokens = await loginApi(request, 'admin@eventmanager.fr');
    const eventName = unique('Conférence Playwright');
    const start = new Date();
    start.setFullYear(start.getFullYear() + 1);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const toLocalInput = (date: Date) => {
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
      return local.toISOString().slice(0, 16);
    };

    await authenticatePage(page, adminTokens);
    await page.goto('/events/create');
    await page.locator('input[name="name"]').fill(eventName);
    await page.locator('textarea[name="description"]').fill('Créé par un test de bout en bout');
    await page.locator('input[name="location"]').fill('Paris');
    await page.locator('input[name="start_date"]').fill(toLocalInput(start));
    await page.locator('input[name="end_date"]').fill(toLocalInput(end));
    await page.locator('input[name="capacity"]').fill('30');
    await page.locator('select[name="status"]').selectOption('PUBLISHED');
    await page.getByRole('button', { name: "Créer l'événement" }).click();

    await expect(page).toHaveURL(/\/events$/);
    await expect(page.getByText(eventName, { exact: true })).toBeVisible();
  });

  test('un administrateur peut approuver une demande de participation', async ({ page, request }) => {
    const adminTokens = await loginApi(request, 'admin@eventmanager.fr');
    const event = await createEvent(request, adminTokens.accessToken);
    const email = `${unique('approbation')}@example.test`;
    const participant = await registerParticipant(request, email);
    const participationResponse = await request.post(`${API_URL}/api/participations/events/${event.id}/request`, {
      headers: { Authorization: `Bearer ${participant.accessToken}` },
    });
    await expectApiSuccess(participationResponse);

    await authenticatePage(page, adminTokens);
    await page.goto('/participants');
    await page.getByPlaceholder('Rechercher par nom, email ou événement').fill(email);
    const row = page.getByRole('row').filter({ hasText: email });
    page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: 'Approuver' }).click();

    await expect(page.getByText('Participation approuvée et QR code généré.')).toBeVisible();
    await expect(row.getByText('Approuvé', { exact: true })).toBeVisible();
  });

  test('le contrôle refuse un QR invalide puis accepte un QR signé autorisé', async ({ page, request }) => {
    const adminTokens = await loginApi(request, 'admin@eventmanager.fr');
    const event = await createEvent(request, adminTokens.accessToken, { withZone: true });
    const zone = event.zones[0];
    const email = `${unique('controle')}@example.test`;
    const participant = await registerParticipant(request, email);
    const participationResponse = await request.post(`${API_URL}/api/participations/events/${event.id}/request`, {
      headers: { Authorization: `Bearer ${participant.accessToken}` },
    });
    await expectApiSuccess(participationResponse);
    const participation = await participationResponse.json();
    const approvalResponse = await request.patch(`${API_URL}/api/participations/${participation.id}/status`, {
      headers: { Authorization: `Bearer ${adminTokens.accessToken}` },
      data: { status: 'APPROVED' },
    });
    await expectApiSuccess(approvalResponse);
    const approved = await approvalResponse.json();

    await authenticatePage(page, adminTokens);
    await page.goto('/presence');
    await page.getByRole('combobox', { name: 'Zone' }).selectOption(String(zone.id));
    const qrField = page.getByLabel('QR code');
    await qrField.fill('token-qr-invalide');
    await page.getByRole('button', { name: 'Valider la présence' }).click();
    await expect(page.getByText('Accès refusé')).toBeVisible();

    await qrField.fill(approved.qr_code);
    await page.getByRole('button', { name: 'Valider la présence' }).click();
    await expect(page.getByText('Accès autorisé')).toBeVisible();
    await expect(page.getByText(zone.name, { exact: true })).toBeVisible();
  });

  test('une route administrateur redirige un visiteur vers la connexion', async ({ page }) => {
    await page.goto('/events/create');
    await expect(page).toHaveURL(/\/login$/);
  });
});
