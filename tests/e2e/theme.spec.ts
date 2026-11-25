import { expect, test } from '@playwright/test';
import { NOMS_THEME, ouvrir } from './outils';

const CLE = 'skazy-outils:theme';

test('le verrou Dark Reader suit la déclaration des deux thèmes', async ({ page }) => {
  await ouvrir(page);
  await expect(
    page.locator('meta[name="color-scheme"][content="light dark"] + meta[name="darkreader-lock"]'),
  ).toHaveCount(1);
});

test('le bouton passe de système à clair, sombre puis système, et le choix est gardé', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await ouvrir(page);
  const bouton = page.locator('#bouton-theme');
  const racine = page.locator('html');
  const schema = () => page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);

  await expect(bouton).toHaveAttribute('aria-label', NOMS_THEME.systeme);
  await expect(racine).not.toHaveAttribute('data-theme');

  await bouton.click();
  await expect(racine).toHaveAttribute('data-theme', 'light');
  await expect(bouton).toHaveAttribute('aria-label', NOMS_THEME.light);
  await expect(bouton).toHaveAttribute('title', NOMS_THEME.light);
  expect(await schema()).toMatch(/^(only light|light only)$/);
  expect(await page.evaluate((cle) => localStorage.getItem(cle), CLE)).toBe('"light"');

  await bouton.click();
  await expect(racine).toHaveAttribute('data-theme', 'dark');
  await expect(bouton).toHaveAttribute('aria-label', NOMS_THEME.dark);

  await page.reload();
  await expect(racine).toHaveAttribute('data-theme', 'dark');
  await expect(bouton).toHaveAttribute('aria-label', NOMS_THEME.dark);

  await bouton.click();
  await expect(racine).not.toHaveAttribute('data-theme');
  await expect(bouton).toHaveAttribute('aria-label', NOMS_THEME.systeme);
  expect(await page.evaluate((cle) => localStorage.getItem(cle), CLE)).toBeNull();
});

test('le thème choisi s’applique avant le script de l’application (pas de flash)', async ({ page }) => {
  await page.addInitScript((cle) => localStorage.setItem(cle, '"dark"'), CLE);
  // Sans le JavaScript de l’application, seul le script en ligne du <head> peut poser le thème.
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const fond = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(fond).toBe('rgb(21, 18, 15)');
});

test('le thème suit un choix fait dans un autre onglet', async ({ page, context }) => {
  await ouvrir(page);
  const autre = await context.newPage();
  await autre.goto('./');
  await autre.locator('#bouton-theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#bouton-theme')).toHaveAttribute('aria-label', NOMS_THEME.light);
  await autre.locator('#bouton-theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#15120f');
});
