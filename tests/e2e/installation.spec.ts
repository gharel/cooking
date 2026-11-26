import { expect, test, type Page } from '@playwright/test';
import { debordement, ouvrir, violationsAxe } from './outils';

const bouton = (page: Page) => page.getByRole('button', { name: 'Installer', exact: true });

/** Le navigateur propose l’installation (Chrome, Edge, Brave sur Android ou ordinateur). */
async function inviter(page: Page, reponse: 'accepted' | 'dismissed'): Promise<void> {
  await page.evaluate((outcome) => {
    const e = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(e, {
      prompt: () => {
        (window as unknown as { invite: string }).invite = 'ouverte';
        return Promise.resolve();
      },
      userChoice: Promise.resolve({ outcome }),
    });
    dispatchEvent(e);
  }, reponse);
}

test('ordinateur : pas de bouton tant que le navigateur ne propose pas l’installation', async ({ page }) => {
  await ouvrir(page);
  await expect(bouton(page)).toHaveCount(0);
});

test('Installer ouvre la fenêtre du navigateur ; installée, le bouton disparaît', async ({ page }) => {
  await ouvrir(page);
  await inviter(page, 'accepted');
  await bouton(page).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { invite?: string }).invite))
    .toBe('ouverte');
  await expect(bouton(page)).toHaveCount(0);
});

test('installation refusée sur ordinateur : l’invitation ne sert qu’une fois', async ({ page }) => {
  await ouvrir(page);
  await inviter(page, 'dismissed');
  await bouton(page).click();
  await expect(bouton(page)).toHaveCount(0);
});

for (const theme of ['light', 'dark'] as const)
  test(`bandeau avec « Installer » à 360 px en thème ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 360, height: 740 });
    await ouvrir(page);
    await inviter(page, 'accepted');
    await expect(bouton(page)).toBeVisible();
    expect(await debordement(page)).toBe(0);
    expect(await violationsAxe(page)).toEqual([]);
  });
