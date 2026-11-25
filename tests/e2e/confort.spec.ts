import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { TAILLES, debordement, violationsAxe } from './outils';

const PAGE = `<html><head><script type="application/ld+json">
{"@context":"https://schema.org","@graph":[{"@type":"Recipe","name":"Tarte aux poireaux","recipeYield":"6",
"recipeIngredient":["3 poireaux","200 g de lardons","1 pâte brisée","3 œufs","20 cl de crème liquide"],
"recipeInstructions":[{"@type":"HowToStep","text":"Émincer les poireaux et les faire fondre 15 min."},
{"@type":"HowToStep","text":"Cuire au four 30 min à 180 °C."}],"url":"https://exemple.fr/tarte"}]}
</script></head><body></body></html>`;

/** Sans menu de partage du système : on retombe sur le téléchargement ou la copie. */
async function sansPartageSysteme(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true });
    Object.defineProperty(Navigator.prototype, 'canShare', { value: undefined, configurable: true });
  });
}

test('importer une recette depuis le code d’une page web', async ({ page }) => {
  await page.goto('./#recettes');
  await page.getByRole('button', { name: 'Depuis une page web' }).click();
  await page.getByLabel('Code de la page ou texte de la recette').fill(PAGE);
  await page.getByRole('button', { name: 'Lire la recette' }).click();
  const editeur = page.getByRole('dialog');
  await expect(editeur.getByLabel('Nom')).toHaveValue('Tarte aux poireaux');
  await expect(editeur.getByLabel('Ingrédients, un par ligne')).toHaveValue(/200 g de lardons/);
  await expect(editeur.getByLabel('La recette, telle qu’on la raconte')).toHaveValue(/Émincer les poireaux/);
  await editeur.getByRole('button', { name: 'Proposer les étapes' }).click();
  await expect(editeur.locator('.etape-editable')).toHaveCount(2);
  await editeur.getByRole('button', { name: 'Enregistrer la recette' }).click();
  await expect(page.locator('main h1')).toHaveText('Tarte aux poireaux');
  await expect(page.locator('main .surtitre')).toHaveText(/Du web/i);
});

test('un partage reçu (?texte=) ouvre l’import prérempli', async ({ page }) => {
  await page.goto(
    './?titre=Crêpes&texte=-%20250%20g%20de%20farine&adresse=https%3A%2F%2Fexemple.fr%2Fcrepes',
  );
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Code de la page ou texte de la recette')).toHaveValue(/Crêpes/);
  await expect(page.getByLabel('Adresse de la page (facultatif)')).toHaveValue('https://exemple.fr/crepes');
  await expect(page).toHaveURL(/#recettes$/);
});

test('partager une recette produit un fichier qui s’importe ailleurs, sous-recette comprise', async ({
  page,
  browser,
}) => {
  await sansPartageSysteme(page);
  await page.goto('./#recettes/depart-lasagne');
  const telechargement = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Partager' }).click();
  const fichier = await (await telechargement).path();
  const contenu = JSON.parse(readFileSync(fichier, 'utf8'));
  expect(contenu.recettes.map((r: { id: string }) => r.id).sort()).toEqual([
    'depart-bolognaise',
    'depart-lasagne',
  ]);

  const ailleurs = await (await browser.newContext()).newPage();
  ailleurs.on('dialog', (d) => void d.accept());
  for (const id of ['depart-lasagne', 'depart-bolognaise']) {
    await ailleurs.goto(`./#recettes/${id}`);
    await ailleurs.getByRole('button', { name: 'Supprimer' }).click();
    await expect(ailleurs).toHaveURL(/#recettes$/);
  }
  await expect(ailleurs.locator('.carte-recette')).toHaveCount(19);
  await ailleurs.locator('input[type="file"][accept*="json"]').setInputFiles({
    name: 'lasagne.fournee.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(contenu)),
  });
  await expect(ailleurs.locator('.carte-recette')).toHaveCount(21);
  await ailleurs.context().close();
});

test('partager la fournée en texte ; les statistiques apparaissent après une session', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-29T14:00:00') });
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'share', {
      value: async (d: ShareData) => {
        (window as unknown as { partage: ShareData }).partage = d;
      },
      configurable: true,
    });
  });
  page.on('dialog', (d) => void d.accept());
  await page.goto('./#semaine');
  await page.getByRole('button', { name: 'Ajouter un plat' }).click();
  await page.getByRole('dialog').getByRole('searchbox').fill('Dahl');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /^Dahl de lentilles/ })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Ajouter à la fournée' }).click();
  await page.getByRole('button', { name: 'Partager la fournée' }).click();
  const texte = await page.evaluate(() => (window as unknown as { partage: ShareData }).partage.text);
  expect(texte).toContain('Plats :\n- Dahl de lentilles (4 portions)');

  await page.goto('./#session');
  await page.getByRole('button', { name: 'Lancer la session' }).click();
  await page.clock.runFor(45 * 60_000);
  await page.getByRole('button', { name: 'Terminer la session' }).click();
  await page.goto('./#semaine');
  await expect(page.locator('.carte-stats')).toContainText(/1\ssession/);
});

for (const theme of ['light', 'dark'] as const) {
  for (const taille of TAILLES) {
    test(`import web et fiche à ${taille.width} px en thème ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize(taille);
      await page.goto('./#recettes/depart-tian-corse');
      await expect(page.locator('main h1')).toHaveText('Tian de légumes corse');
      expect(await debordement(page), 'fiche').toBe(0);
      expect(await violationsAxe(page), 'fiche').toEqual([]);
      await page.goto('./#recettes');
      await page.getByRole('button', { name: 'Depuis une page web' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await violationsAxe(page), 'import').toEqual([]);
    });
  }
}
