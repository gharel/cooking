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
  // Lavage des mains au début (en même temps que le préchauffage), rangement à la fin.
  const mains = etapes.filter({ hasText: 'Tout le monde se lave les mains' });
  await expect(mains).toHaveCount(1);
  expect(await mains.locator('time').textContent()).toBe(await etapes.first().locator('time').textContent());
  await expect(etapes.last()).toContainText('Portionner, étiqueter');
  await expect(page.locator('.deroule')).toContainText('Charger le lave-vaisselle');
  const avant = await etapes.count();

  // À deux : prénoms, répartition, frise par personne.
  await page.getByLabel('Prénom de la personne 1').fill('Guillaume');
  await page.getByRole('button', { name: 'Ajouter une personne' }).click();
  await page.getByLabel('Prénom de la personne 2').fill('Hélène');
  await expect(page.locator('.frise-voie', { hasText: 'Hélène' })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Qui fait quoi' })).toBeVisible();
  await expect(page.locator('.repartition-personne')).toHaveCount(2);
  await expect(page.locator('.repartition-personne').nth(1)).toContainText(/\d+\sétapes?\s·/);
  expect(await etapes.count()).toBe(avant);

  // Sans lave-vaisselle : la vaisselle à la main, plus longue.
  await page.getByRole('checkbox', { name: 'Lave-vaisselle' }).uncheck();
  await expect(page.locator('.deroule')).toContainText('Faire la vaisselle de la préparation');
  await page.reload();
  await expect(page.getByLabel('Prénom de la personne 2')).toHaveValue('Hélène');
  await expect(page.getByRole('checkbox', { name: 'Lave-vaisselle' })).not.toBeChecked();
});

test('soupe fajitas : les légumes passent sur la planche avant le poulet cru', async ({ page }) => {
  await preparerFournee(page, ['Soupe fajitas']);
  const textes = await page.locator('.deroule li strong').allTextContents();
  const legumes = textes.findIndex((t) => t.startsWith('Émincer l’oignon'));
  const poulet = textes.findIndex((t) => t.startsWith('Couper le poulet'));
  expect(legumes).toBeGreaterThan(0);
  expect(poulet).toBeGreaterThan(legumes);
  expect(textes[poulet]).toContain('puis laver la planche et le couteau, se laver les mains');
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
