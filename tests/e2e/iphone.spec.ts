import { createRequire } from 'node:module';
import { expect, test, type Page } from '@playwright/test';
import { debordement, ouvrir, violationsAxe } from './outils';

const require = createRequire(import.meta.url);
const darkreader = require.resolve('darkreader/darkreader.js');

const fond = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

async function activerDarkReader(page: Page): Promise<void> {
  await page.addScriptTag({ path: darkreader });
  await page.evaluate(() =>
    (window as unknown as { DarkReader: { enable: () => void } }).DarkReader.enable(),
  );
  await page.waitForTimeout(500);
}

// Brave sur iPhone : le mode nuit injecte Dark Reader. La page a son propre thème sombre et le verrouille.
test('iPhone : Dark Reader ne repeint pas la page en thème clair choisi', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await ouvrir(page);
  expect(await fond(page)).toBe('rgb(21, 18, 15)');

  await page.locator('#bouton-theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await fond(page)).toBe('rgb(250, 247, 242)');

  await activerDarkReader(page);
  expect(await fond(page)).toBe('rgb(250, 247, 242)');
  await expect(page.locator('style.darkreader')).toHaveCount(0);
});

// Contrôle : sans le verrou, le même Dark Reader repeint bien la page, donc le test ci-dessus mesure quelque chose.
test('iPhone : sans le verrou, Dark Reader repeindrait la page (contrôle)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await ouvrir(page);
  await page.evaluate(() => document.querySelector('meta[name="darkreader-lock"]')?.remove());
  await activerDarkReader(page);
  expect(await fond(page)).not.toBe('rgb(250, 247, 242)');
});

test('iPhone : « Installer » explique Partager, puis « Sur l’écran d’accueil »', async ({ page }) => {
  await ouvrir(page);
  const bouton = page.getByRole('button', { name: 'Installer', exact: true });
  await bouton.click();
  const dialogue = page.getByRole('dialog', { name: 'Installer Fournée' });
  await expect(dialogue).toContainText('Partager');
  await expect(dialogue).toContainText('« Sur l’écran d’accueil »');
  await expect(dialogue).toContainText('exportez-les');
  expect(await debordement(page)).toBe(0);
  expect(await violationsAxe(page)).toEqual([]);
  await dialogue.getByRole('button', { name: 'J’ai compris' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(bouton).toBeFocused();
});
