import { expect, test } from '@playwright/test';
import { ouvrir } from './outils';

test('le manifeste déclare le nom et les icônes 192, 512 et masquable', async ({ page, request }) => {
  await ouvrir(page);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifeste = await (await request.get(href ?? '')).json();
  expect(manifeste.name).toBe('Fournée');
  expect(manifeste.lang).toBe('fr');
  const icones: { sizes: string; purpose?: string }[] = manifeste.icons;
  expect(icones.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(icones.some((i) => i.purpose === 'maskable')).toBe(true);
});

test('après une première visite, l’application se recharge hors ligne', async ({ page, context }) => {
  await ouvrir(page);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, {
    timeout: 15_000,
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('main h1')).toHaveText(/semaine/i);
  await page
    .getByRole('navigation', { name: 'Navigation principale' })
    .getByRole('link', { name: 'Recettes' })
    .click();
  await expect(page).toHaveTitle('Recettes\u00a0· Fournée');
  await context.setOffline(false);
});
