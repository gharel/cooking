import { expect, test, type Page } from '@playwright/test';
import { TAILLES, debordement, violationsAxe } from './outils';

// Dimanche 29 novembre 2026, 14 h : jour de session.
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-29T14:00:00') });
});

/** Gratin pour lundi midi et jeudi midi, session lancée puis terminée : 2 portions au frigo, 2 au congélateur. */
async function sessionTerminee(page: Page): Promise<void> {
  page.on('dialog', (d) => void d.accept());
  await page.goto('./#semaine');
  await page.getByRole('button', { name: 'Ajouter un plat' }).click();
  await page.getByRole('dialog').getByRole('searchbox').fill('Gratin dauphinois');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Gratin dauphinois/ })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Ajouter à la fournée' }).click();
  await page
    .getByRole('combobox', { name: 'Repas du lundi midi' })
    .selectOption({ label: 'Gratin dauphinois' });
  await page
    .getByRole('combobox', { name: 'Repas du jeudi midi' })
    .selectOption({ label: 'Gratin dauphinois' });
  await page.goto('./#session');
  await page.getByRole('button', { name: 'Lancer la session' }).click();
  await page.getByRole('button', { name: 'Terminer la session' }).click();
  await expect(page.locator('.bilan')).toBeVisible();
  await page.goto('./#frigo');
}

const carte = (page: Page, texte: RegExp | string) => page.locator('.plat', { hasText: texte });

test('fin de session : frigo et congélateur, rappel de décongélation', async ({ page }) => {
  await sessionTerminee(page);
  await expect(page.locator('.plat')).toHaveCount(2);
  await expect(carte(page, /Frigo\s·\s2\sportions/)).toContainText('mercredi 2 décembre');
  await expect(carte(page, /Congélateur\s·\s2\sportions/)).toBeVisible();
  await expect(page.locator('.rappels')).toContainText(
    /mercredi 2\sdécembre au soir\s:\ssortir 2\sportions de Gratin dauphinois pour jeudi midi/,
  );
});

test('manger jusqu’à la dernière portion, annuler, décongeler', async ({ page }) => {
  await sessionTerminee(page);
  const frigo = carte(page, /Frigo\s·/);
  await frigo.getByRole('button', { name: 'Manger 1 portion' }).click();
  await expect(frigo).toContainText(/1\sportion\s·/);
  await frigo.getByRole('button', { name: 'Manger 1 portion' }).click();
  await expect(page.locator('.plat')).toHaveCount(1);
  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.locator('.plat')).toHaveCount(2);

  await carte(page, /Congélateur\s·/)
    .getByRole('button', { name: 'Décongeler' })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sortir du congélateur' }).click();
  await expect(page.locator('.plat')).toHaveCount(2);
  await expect(page.locator('.plat', { hasText: /Frigo\s·\s2\sportions/ })).toHaveCount(1);
  await expect(page.locator('.plat', { hasText: /Frigo\s·\s1\sportion\s·/ })).toHaveCount(1);
});

test('un plat à manger aujourd’hui déclenche l’alerte', async ({ page }) => {
  await page.goto('./#frigo');
  await page.getByRole('button', { name: 'Ajouter un plat' }).click();
  const dialogue = page.getByRole('dialog');
  await dialogue.getByLabel('Nom du plat').fill('Reste de soupe');
  await dialogue.getByLabel('À manger avant le').fill('2026-11-29');
  await dialogue.getByRole('button', { name: 'Ajouter' }).click();
  await expect(page.locator('.bandeau-alerte')).toContainText('Reste de soupe : à manger aujourd’hui');
});

test('ce qu’il reste : idées, mise à jour, ajout d’une idée à la bibliothèque', async ({ page }) => {
  await page.goto('./#reste');
  await expect(page.getByRole('tab', { name: 'Ce qu’il reste' })).toHaveAttribute('aria-selected', 'true');
  await page
    .getByLabel('Ajouter un ingrédient')
    .fill('½ courgette, 100 g de feta, 6 œufs, 1 poivron, 1 oignon, 10 cl de lait');
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
  const frittata = page.locator('.idee', { hasText: 'Frittata aux légumes' });
  await expect(frittata).toContainText('Rien à acheter');
  await page.getByRole('button', { name: 'Retirer 100 g de feta' }).click();
  await expect(frittata).toContainText('Il manque');
  await frittata.getByRole('button', { name: 'Ajouter à mes recettes' }).click();
  await expect(page.locator('main h1')).toHaveText('Frittata aux légumes');
  await expect(page.locator('.etapes-structurees li').first()).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  for (const taille of TAILLES) {
    test(`frigo à ${taille.width} px en thème ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize(taille);
      await sessionTerminee(page);
      await expect(page.locator('.plat').first()).toBeVisible();
      expect(await debordement(page), 'plats').toBe(0);
      expect(await violationsAxe(page), 'plats').toEqual([]);
      await page.getByRole('tab', { name: 'Ce qu’il reste' }).click();
      await page.getByLabel('Ajouter un ingrédient').fill('½ courgette, 100 g de feta, 3 œufs, 1 poivron');
      await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
      await expect(page.locator('.idee').first()).toBeVisible();
      expect(await debordement(page), 'reste').toBe(0);
      expect(await violationsAxe(page), 'reste').toEqual([]);
    });
  }
}
