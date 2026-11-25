import { createRequire } from 'node:module';
import { expect, test, type Page } from '@playwright/test';
import { ouvrir } from './outils';

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
