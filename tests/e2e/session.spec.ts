import { expect, test, type Page } from '@playwright/test';
import { TAILLES, debordement, violationsAxe } from './outils';

// Dimanche 29 novembre 2026, 14 h : jour de session.
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-29T14:00:00') });
});

async function preparerFournee(page: Page, plats: string[]): Promise<void> {
  await page.goto('./#semaine');
  await expect(page.locator('.carte-session')).toBeVisible();
  for (const nom of plats) {
    await page.getByRole('button', { name: 'Ajouter un plat' }).click();
    const dialogue = page.getByRole('dialog');
    await dialogue.getByRole('searchbox').fill(nom);
    await dialogue.getByRole('button', { name: new RegExp(`^${nom}`) }).click();
    await dialogue.getByRole('button', { name: 'Ajouter à la fournée' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.goto('./#session');
  await expect(page.locator('main h1')).toHaveText('Préparer la session');
}

test('préparer : durée estimée, gain, équipement, veille, déroulé complet', async ({ page }) => {
  await preparerFournee(page, ['Gratin dauphinois', 'Chili con carne', 'Brandade de morue']);
  await expect(page.locator('.carte-session')).toContainText(/gagnées/);
  await expect(page.locator('.veille')).toContainText('Dessaler la morue');
  const etapes = page.locator('.deroule li');
  await expect(etapes.first()).toBeVisible();
  const avant = await etapes.count();
  await page
    .getByRole('group', { name: 'Cuisiniers' })
    .getByRole('button', { name: /une de plus/ })
    .click();
  await expect(page.locator('.frise-voie', { hasText: 'Cuisinier 2' })).toHaveCount(1);
  expect(await etapes.count()).toBe(avant);
});

test('en direct : étape terminée, minuteur qui s’écoule, fin de session et plats rangés', async ({
  page,
}) => {
  page.on('dialog', (d) => void d.accept());
  await preparerFournee(page, ['Gratin dauphinois', 'Chili con carne']);
  await page.getByRole('button', { name: 'Lancer la session' }).click();
  await expect(page.locator('main h1')).toHaveText('Session en cours');

  const maintenant = page.locator('.maintenant h2').first();
  const premiere = await maintenant.textContent();
  await expect(page.locator('.minuteur', { hasText: 'Préchauffer le four' })).toBeVisible();
  await page.getByRole('button', { name: 'Étape terminée' }).first().click();
  await expect(maintenant).not.toHaveText(premiere ?? '');

  await page.clock.runFor(16 * 60_000);
  await expect(page.locator('.minuteur', { hasText: 'Préchauffer le four' })).toHaveCount(0);
  await expect(page.locator('.progression-texte')).toContainText(/min écoulées/);

  await page.getByRole('button', { name: 'Terminer la session' }).click();
  await expect(page.getByRole('status').filter({ hasText: /Session terminée/ })).toContainText(
    /2\splats rangés/,
  );
  await expect(page.locator('.bilan')).toContainText('Dernière session');
  await expect(page.locator('main h1')).toHaveText('Session');
});

test('la session survit au rechargement et reprend là où elle en était', async ({ page }) => {
  await preparerFournee(page, ['Dahl de lentilles']);
  await page.getByRole('button', { name: 'Lancer la session' }).click();
  const premiere = await page.locator('.maintenant h2').first().textContent();
  await page.getByRole('button', { name: 'Étape terminée' }).first().click();
  await expect(page.locator('.maintenant h2').first()).not.toHaveText(premiere ?? '');
  await page.clock.runFor(2000);
  const titre = await page.locator('.maintenant h2').first().textContent();
  await page.reload();
  await expect(page.locator('main h1')).toHaveText('Session en cours');
  await expect(page.locator('.maintenant h2').first()).toHaveText(titre ?? '');
  await expect(page.locator('.progression-texte')).toContainText(/1\sétape sur/);
});

for (const theme of ['light', 'dark'] as const) {
  for (const taille of TAILLES) {
    test(`session à ${taille.width} px en thème ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize(taille);
      await preparerFournee(page, ['Gratin dauphinois', 'Quiche lorraine']);
      expect(await debordement(page), 'préparation').toBe(0);
      expect(await violationsAxe(page), 'préparation').toEqual([]);
      await page.getByRole('button', { name: 'Lancer la session' }).click();
      await page.clock.runFor(5 * 60_000);
      await expect(page.locator('.minuteur').first()).toBeVisible();
      expect(await debordement(page), 'direct').toBe(0);
      expect(await violationsAxe(page), 'direct').toEqual([]);
    });
  }
}
