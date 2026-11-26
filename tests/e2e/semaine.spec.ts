import { expect, test, type Page } from '@playwright/test';
import { TAILLES, debordement, violationsAxe } from './outils';

// Mercredi 25 novembre 2026 : la session tombe le dimanche 29, la semaine va du 30 au 6 décembre.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-25T10:00:00'));
});

async function ouvrirSemaine(page: Page): Promise<void> {
  await page.goto('./#semaine');
  await expect(page.locator('main h1')).toHaveText(/Semaine du 30\snovembre au 6\sdécembre/);
}

async function ajouterPlat(page: Page, nom: string, portions = 4): Promise<void> {
  await page.getByRole('button', { name: 'Ajouter un plat' }).click();
  const dialogue = page.getByRole('dialog');
  await dialogue.getByRole('searchbox').fill(nom);
  await dialogue.getByRole('button', { name: new RegExp(`^${nom}`) }).click();
  const compteur = dialogue.getByRole('group', { name: 'Portions' });
  await expect(compteur.locator('output')).toHaveText('4');
  for (let p = 4; p < portions; p++) await compteur.getByRole('button', { name: /une de plus/ }).click();
  await dialogue.getByRole('button', { name: 'Ajouter à la fournée' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

const ligneCourses = (page: Page, texte: RegExp) => page.locator('.article', { hasText: texte });

test('choisir un plat demande les portions ; 8 portions doublent les courses', async ({ page }) => {
  await ouvrirSemaine(page);
  await ajouterPlat(page, 'Chili con carne', 8);
  await expect(page.getByRole('group', { name: 'Portions de Chili con carne' }).locator('output')).toHaveText(
    '8',
  );
  await page.goto('./#courses');
  await expect(ligneCourses(page, /1\skg de bœuf haché/)).toHaveCount(1);
  await expect(ligneCourses(page, /2\soignons/)).toHaveCount(1);
});

test('depuis la fiche : la bolognaise rejoint la fournée et le bœuf s’additionne', async ({ page }) => {
  await ouvrirSemaine(page);
  await ajouterPlat(page, 'Chili con carne', 4);
  await page.goto('./#recettes/depart-bolognaise');
  await page.getByRole('button', { name: 'Ajouter à la fournée' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Ajouter à la fournée' }).click();
  await page.goto('./#courses');
  const boeuf = ligneCourses(page, /1\skg de bœuf haché/);
  await expect(boeuf).toContainText('Chili con carne 500 g');
  await expect(boeuf).toContainText('Bolognaise 500 g');
});

test('répartir automatiquement couvre 8 repas avec 4 plats de 4 portions pour 2 personnes', async ({
  page,
}) => {
  await ouvrirSemaine(page);
  for (const nom of ['Chili con carne', 'Dahl de lentilles', 'Gratin dauphinois', 'Quiche lorraine'])
    await ajouterPlat(page, nom);
  await page.getByRole('button', { name: 'Répartir automatiquement' }).click();
  await expect(page.locator('.stat').first()).toHaveText(/8\ssur 14/);
});

test('repas à l’extérieur : un soir ponctuel, puis tous les midis de la semaine', async ({ page }) => {
  page.on('dialog', (d) => void d.accept());
  await ouvrirSemaine(page);
  await ajouterPlat(page, 'Chili con carne', 8);
  const mardiSoir = page.getByRole('combobox', { name: 'Repas du mardi soir' });
  await mardiSoir.selectOption('d');
  await expect(page.locator('.repas-dehors')).toHaveText(/À l’extérieur/);
  await expect(page.locator('.stat').first()).toHaveText(/0\ssur\s13/);
  await page.getByRole('button', { name: 'Répartir automatiquement' }).click();
  await expect(page.locator('.stat').first()).toHaveText(/4\ssur\s13/);
  await expect(mardiSoir).toHaveValue('d');
  await page.reload();
  await expect(mardiSoir).toHaveValue('d');

  // Toute la semaine : les midis à l’extérieur (les plats prévus le midi sont retirés après confirmation).
  const midis = page.getByRole('group', { name: 'À la maison cette semaine' }).getByRole('checkbox', {
    name: 'Midis',
  });
  await midis.uncheck();
  await expect(page.getByRole('combobox', { name: 'Repas du lundi midi' })).toHaveValue('d');
  await expect(page.locator('.stat').first()).toHaveText(/sur\s6/);
  await page.reload();
  await expect(midis).not.toBeChecked();
  await midis.check();
  await expect(page.getByRole('combobox', { name: 'Repas du lundi midi' })).toHaveValue('');
  await expect(page.locator('.stat').first()).toHaveText(/sur\s13/);
  await expect(mardiSoir).toHaveValue('d');
});

test('un gratin prévu jeudi midi doit être congelé et sorti mercredi soir', async ({ page }) => {
  await ouvrirSemaine(page);
  await ajouterPlat(page, 'Gratin dauphinois');
  await page
    .getByRole('combobox', { name: 'Repas du jeudi midi' })
    .selectOption({ label: 'Gratin dauphinois' });
  await expect(page.locator('.vigilance')).toContainText('Gratin dauphinois, jeudi midi');
  await expect(page.locator('.vigilance')).toContainText('sortez-les mercredi soir');
});

test('la brandade rappelle de dessaler la morue la veille', async ({ page }) => {
  await ouvrirSemaine(page);
  await ajouterPlat(page, 'Brandade de morue');
  await expect(page.locator('.vigilance')).toContainText(/à faire la veille, samedi 28\snovembre/);
});

test('courses : cocher survit au rechargement, « J’en ai » envoie au placard', async ({ page }) => {
  await ouvrirSemaine(page);
  await ajouterPlat(page, 'Dahl de lentilles');
  await page.goto('./#courses');
  const lentilles = ligneCourses(page, /lentilles corail/);
  await lentilles.getByRole('checkbox').check();
  await page.reload();
  await expect(ligneCourses(page, /lentilles corail/).getByRole('checkbox')).toBeChecked();
  await expect(page.locator('.progression-texte')).toContainText('1 sur');
  await ligneCourses(page, /oignon/)
    .getByRole('button', { name: /J’en ai/ })
    .click();
  await expect(page.locator('.placard')).toContainText('1 oignon');
  await page
    .locator('.placard li', { hasText: '1 oignon' })
    .getByRole('button', { name: /À acheter/ })
    .click();
  await expect(ligneCourses(page, /1\soignon/)).toHaveCount(1);
  await expect(page.locator('.placard')).toContainText('curry');
});

for (const theme of ['light', 'dark'] as const) {
  for (const taille of TAILLES) {
    test(`semaine et courses à ${taille.width} px en thème ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize(taille);
      await ouvrirSemaine(page);
      await ajouterPlat(page, 'Gratin dauphinois');
      await ajouterPlat(page, 'Brandade de morue');
      await page.getByRole('button', { name: 'Répartir automatiquement' }).click();
      expect(await debordement(page), 'semaine').toBe(0);
      expect(await violationsAxe(page), 'semaine').toEqual([]);
      await page.goto('./#courses');
      await expect(page.locator('.article').first()).toBeVisible();
      expect(await debordement(page), 'courses').toBe(0);
      expect(await violationsAxe(page), 'courses').toEqual([]);
    });
  }
}
