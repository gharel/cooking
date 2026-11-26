import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { debordement, violationsAxe } from './outils';

const rappel = (page: Page) => page.locator('.rappel-sauvegarde');

/** Une recette personnelle, enregistrée le jour où l’horloge a été posée. */
async function creerRecette(page: Page): Promise<void> {
  await page.goto('./#recettes');
  await expect(page.locator('.carte-recette')).toHaveCount(21);
  await page.getByRole('button', { name: 'Nouvelle recette' }).click();
  const editeur = page.getByRole('dialog');
  await editeur.getByLabel('Nom').fill('Soupe de la maison');
  await editeur.getByLabel('La recette, telle qu’on la raconte').fill('Cuire les légumes 20 min. Mixer.');
  await editeur.getByRole('button', { name: 'Proposer les étapes' }).click();
  await editeur.getByRole('button', { name: 'Enregistrer la recette' }).click();
  await expect(page.locator('main h1')).toHaveText('Soupe de la maison');
}

/** Le rappel se lit après la bibliothèque : on lui laisse le temps d’apparaître avant de conclure à son absence. */
async function sansRappel(page: Page): Promise<void> {
  await expect(page.locator('main h1')).toHaveCount(1);
  await page.waitForTimeout(500);
  await expect(rappel(page)).toHaveCount(0);
}

test('rappel de sauvegarde : au bout de 7 jours, « Plus tard », puis « Exporter maintenant »', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-11-20T10:00:00') });
  await creerRecette(page);
  await page.goto('./#semaine');
  await sansRappel(page);

  await page.clock.setSystemTime(new Date('2026-11-27T11:00:00'));
  await page.reload();
  await expect(rappel(page)).toContainText(/1\srecette n’est pas sauvegardée\./);
  await expect(rappel(page)).toContainText('Aucune sauvegarde pour l’instant.');
  await rappel(page).getByRole('button', { name: 'Plus tard' }).click();
  await expect(rappel(page)).toHaveCount(0);
  await expect(page.locator('main h1')).toBeFocused();
  await page.reload();
  await sansRappel(page);

  await page.clock.setSystemTime(new Date('2026-12-04T11:00:00'));
  await page.goto('./#recettes');
  await expect(rappel(page)).toBeVisible();
  const telechargement = page.waitForEvent('download');
  await rappel(page).getByRole('button', { name: 'Exporter maintenant' }).click();
  const fichier = await (await telechargement).path();
  expect(JSON.parse(readFileSync(fichier, 'utf8')).recettes).toHaveLength(22);
  await expect(rappel(page)).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.carte-recette')).toHaveCount(22);
  await sansRappel(page);
});

for (const theme of ['light', 'dark'] as const) {
  test(`rappel de sauvegarde à 360 px en thème ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 360, height: 740 });
    await page.clock.install({ time: new Date('2026-11-20T10:00:00') });
    await creerRecette(page);
    await page.clock.setSystemTime(new Date('2026-11-28T10:00:00'));
    for (const ancre of ['#semaine', '#recettes']) {
      await page.goto(`./${ancre}`);
      await expect(rappel(page)).toBeVisible();
      expect(await debordement(page), ancre).toBe(0);
      expect(await violationsAxe(page), ancre).toEqual([]);
    }
  });
}
