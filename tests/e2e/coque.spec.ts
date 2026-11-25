import { expect, test } from '@playwright/test';
import { ECRANS, TAILLES, debordement, ouvrir, violationsAxe } from './outils';

for (const theme of ['light', 'dark'] as const) {
  for (const taille of TAILLES) {
    test(`les 5 écrans à ${taille.width} px en thème ${theme} : mise en page et accessibilité`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize(taille);
      await ouvrir(page);
      for (const ecran of ECRANS) {
        await page.evaluate((id) => (location.hash = id), ecran.id);
        await expect(page).toHaveTitle(`${ecran.nom}\u00a0· Fournée`);
        await expect(page.locator('main h1')).toHaveCount(1);
        expect(await debordement(page), `débordement sur ${ecran.id}`).toBe(0);
        expect(await violationsAxe(page), `axe sur ${ecran.id}`).toEqual([]);
      }
    });
  }
}

test('la navigation affiche l’écran, marque le lien et place le focus sur le titre', async ({ page }) => {
  await ouvrir(page);
  const navigation = page.getByRole('navigation', { name: 'Navigation principale' });
  for (const ecran of ECRANS) {
    await navigation.getByRole('link', { name: ecran.nom }).click();
    await expect(page).toHaveURL(new RegExp(`#${ecran.id}$`));
    await expect(navigation.getByRole('link', { name: ecran.nom })).toHaveAttribute('aria-current', 'page');
    await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('main h1')).toBeFocused();
  }
});

test('#reste ouvre Frigo sur l’onglet « Ce qu’il reste »', async ({ page }) => {
  await ouvrir(page, '#reste');
  await expect(page).toHaveTitle('Frigo\u00a0· Fournée');
  await expect(page.getByRole('tab', { name: 'Ce qu’il reste' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
});

test('les onglets de Frigo se parcourent au clavier', async ({ page }) => {
  await ouvrir(page, '#frigo');
  const plats = page.getByRole('tab', { name: 'Plats préparés' });
  const reste = page.getByRole('tab', { name: 'Ce qu’il reste' });
  await expect(plats).toHaveAttribute('aria-selected', 'true');
  await plats.focus();
  await page.keyboard.press('ArrowRight');
  await expect(reste).toBeFocused();
  await expect(reste).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(plats).toHaveAttribute('aria-selected', 'true');
});

test('une ancre inconnue affiche Semaine', async ({ page }) => {
  await ouvrir(page, '#nimporte-quoi');
  await expect(page).toHaveTitle('Semaine\u00a0· Fournée');
});

test('le lien d’évitement mène au contenu sans changer d’écran', async ({ page }) => {
  await ouvrir(page, '#courses');
  await page.keyboard.press('Tab');
  const lien = page.getByRole('link', { name: 'Aller au contenu' });
  await expect(lien).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page).toHaveTitle('Courses\u00a0· Fournée');
});

test('chaque écran renvoie vers son équivalent dans la maquette, qui reste en ligne', async ({
  page,
  request,
}) => {
  await ouvrir(page);
  for (const ecran of ECRANS) {
    await page.evaluate((id) => (location.hash = id), ecran.id);
    const lien = page.getByRole('link', { name: 'Voir cet écran dans la maquette' });
    await expect(lien).toHaveAttribute('href', `/cooking/maquette/#${ecran.id}`);
  }
  const reponse = await request.get('maquette/');
  expect(reponse.status()).toBe(200);
  expect(await reponse.text()).toContain('<title>Semaine · Fournée</title>');
});

test('le texte affiché suit la typographie française (espaces insécables)', async ({ page }) => {
  await ouvrir(page);
  const sousTitre = await page.locator('main .sous-titre').first().textContent();
  expect(sousTitre).toContain('\u00a0:');
  expect(sousTitre).not.toMatch(/ [:;!?]/);
});

test('aucune requête vers une autre origine (polices comprises)', async ({ page }) => {
  const externes: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost')) externes.push(r.url());
  });
  await ouvrir(page);
  await page.evaluate(() => document.fonts.ready);
  expect(externes).toEqual([]);
  const polices = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')),
  );
  expect(polices).toEqual(expect.arrayContaining(['Fraunces Variable', 'Figtree Variable']));
});
