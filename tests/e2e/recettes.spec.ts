import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { TAILLES, debordement, violationsAxe } from './outils';

const HACHIS =
  'Cuire 1 kg de pommes de terre 25 min dans l’eau salée. Pendant ce temps, faire revenir 2 oignons puis 500 g de bœuf haché. Écraser les pommes de terre avec 20 cl de lait, 50 g de beurre et une pointe de muscade. Monter dans le plat, mettre le fromage et gratiner 20 min à 200 °C.';

const cartes = (page: Page) => page.locator('.carte-recette');

async function bibliotheque(page: Page): Promise<void> {
  await page.goto('./#recettes');
  await expect(cartes(page)).toHaveCount(21);
}

/** Les confirmations (supprimer, abandonner) sont acceptées. */
function accepterConfirmations(page: Page): void {
  page.on('dialog', (d) => void d.accept());
}

async function creerHachis(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Nouvelle recette' }).click();
  const editeur = page.getByRole('dialog');
  await expect(editeur).toBeVisible();
  await editeur.getByLabel('Nom').fill('Hachis parmentier de maman');
  await expect(editeur.getByRole('radio', { name: 'De la famille' })).toBeChecked();
  await editeur.getByLabel('De qui ?').fill('Maman');
  await editeur.getByLabel('La recette, telle qu’on la raconte').fill(HACHIS);
  await editeur.getByRole('button', { name: 'Proposer les étapes' }).click();
}

test('la bibliothèque contient les 21 recettes de départ, se fouille et se filtre', async ({ page }) => {
  await bibliotheque(page);
  const recherche = page.getByRole('searchbox', { name: 'Rechercher une recette' });
  await recherche.fill('gratin');
  await expect(cartes(page)).toHaveCount(2);
  await recherche.fill('legumes');
  await expect(cartes(page)).toHaveText([/Soupe aux légumes/, /Tian de légumes corse/]);
  await recherche.fill('');
  const filtres = page.getByRole('group', { name: 'Filtres' });
  await filtres.getByRole('button', { name: 'Végétarien' }).click();
  await expect(cartes(page)).toHaveCount(6);
  await filtres.getByRole('button', { name: 'Four' }).click();
  await expect(cartes(page)).toHaveCount(2);
  await filtres.getByRole('button', { name: 'Végétarien' }).click();
  await filtres.getByRole('button', { name: 'Four' }).click();
  await filtres.getByRole('button', { name: 'Congelable' }).click();
  await expect(cartes(page)).toHaveCount(13);
});

test('la fiche montre les étapes, ce qui se fait la veille et les sous-recettes', async ({ page }) => {
  await bibliotheque(page);
  await cartes(page).filter({ hasText: 'Brandade de morue' }).click();
  await expect(page).toHaveURL(/#recettes\/depart-brandade$/);
  await expect(page.locator('main h1')).toHaveText('Brandade de morue');
  await expect(page.locator('main h1')).toBeFocused();
  await expect(page.locator('.attribut', { hasText: 'La veille' })).toHaveCount(1);
  await page.goto('./#recettes/depart-lasagne');
  await page.getByRole('link', { name: /Bolognaise : 4 portions/ }).click();
  await expect(page.locator('main h1')).toHaveText('Bolognaise');
});

test('un identifiant inconnu affiche la bibliothèque et un message', async ({ page }) => {
  await page.goto('./#recettes/nimporte-quoi');
  await expect(page.getByText(/Cette recette n’existe pas ou plus/)).toBeVisible();
  await expect(cartes(page)).toHaveCount(21);
});

test('une recette de famille racontée devient structurée, et son texte est gardé à l’identique', async ({
  page,
}) => {
  await bibliotheque(page);
  await creerHachis(page);
  const editeur = page.getByRole('dialog');
  await expect(editeur.getByRole('status')).toHaveText(
    /5\sétapes proposées, 3\sdurées devinées à vérifier, 7\singrédients reconnus/,
  );
  await expect(editeur.locator('.etape-editable')).toHaveCount(5);
  await expect(editeur.getByText('Durée devinée, à vérifier')).toHaveCount(3);
  await expect(editeur.getByLabel('Ingrédients, un par ligne')).toHaveValue(/500 g de bœuf haché/);
  await editeur.getByRole('button', { name: 'Enregistrer la recette' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('main h1')).toHaveText('Hachis parmentier de maman');
  await expect(page.locator('.pastille-famille')).toHaveText(/De Maman/);
  await expect(page.locator('.texte-original')).toHaveText(HACHIS, { useInnerText: false });

  await page.reload();
  await expect(page.locator('main h1')).toHaveText('Hachis parmentier de maman');
  expect(await page.locator('.texte-original').textContent()).toBe(HACHIS);
  await page.getByRole('button', { name: 'Modifier' }).click();
  await expect(page.getByLabel('La recette, telle qu’on la raconte')).toHaveValue(HACHIS);
});

test('modifier, abandonner, dupliquer, supprimer puis annuler', async ({ page }) => {
  accepterConfirmations(page);
  await page.goto('./#recettes/depart-dahl');
  await expect(page.locator('main h1')).toHaveText('Dahl de lentilles');

  await page.getByRole('button', { name: 'Modifier' }).click();
  await page.getByRole('dialog').getByLabel('Nom').fill('Dahl abandonné');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Modifier' })).toBeFocused();
  await expect(page.locator('main h1')).toHaveText('Dahl de lentilles');

  await page.getByRole('button', { name: 'Modifier' }).click();
  await page.getByRole('dialog').getByLabel('Nom').fill('Dahl de la maison');
  await page.getByRole('button', { name: 'Enregistrer la recette' }).click();
  await expect(page.locator('main h1')).toHaveText('Dahl de la maison');

  await page.getByRole('button', { name: 'Dupliquer' }).click();
  await expect(page.locator('main h1')).toHaveText('Dahl de la maison (copie)');
  const adresseCopie = page.url();

  await page.getByRole('button', { name: 'Supprimer' }).click();
  await expect(page).toHaveURL(/#recettes$/);
  await expect(cartes(page)).toHaveCount(21);
  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page).toHaveURL(adresseCopie);
  await expect(page.locator('main h1')).toHaveText('Dahl de la maison (copie)');
});

test('une recette de départ supprimée se réinstalle à la demande', async ({ page }) => {
  accepterConfirmations(page);
  await page.goto('./#recettes/depart-ratatouille');
  await page.getByRole('button', { name: 'Supprimer' }).click();
  await expect(cartes(page)).toHaveCount(20);
  await page.reload();
  await expect(cartes(page)).toHaveCount(20);
  await page.getByRole('button', { name: /Réinstaller les recettes de départ manquantes \(1\)/ }).click();
  await expect(cartes(page)).toHaveCount(21);
});

test('une photo de la fiche est réduite, affichée et gardée', async ({ page }) => {
  await bibliotheque(page);
  // Grande image (3000 × 2000) fabriquée dans le navigateur.
  const base64 = await page.evaluate(async () => {
    const toile = document.createElement('canvas');
    toile.width = 3000;
    toile.height = 2000;
    const ctx = toile.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#b4532a';
      ctx.fillRect(0, 0, 3000, 2000);
    }
    const blob = await new Promise<Blob | null>((r) => toile.toBlob(r, 'image/png'));
    const octets = new Uint8Array(await (blob ?? new Blob()).arrayBuffer());
    let binaire = '';
    for (const o of octets) binaire += String.fromCharCode(o);
    return btoa(binaire);
  });
  await creerHachis(page);
  await page
    .locator('input[type="file"][accept="image/*"]')
    .setInputFiles({ name: 'fiche.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') });
  await expect(page.getByRole('dialog').getByAltText('Nouvelle photo 1 de la fiche')).toBeVisible();
  await page.getByRole('button', { name: 'Enregistrer la recette' }).click();

  const photo = page.getByAltText(/Photo 1 de la fiche/);
  await expect(photo).toBeVisible();
  await page.reload();
  await expect(photo).toBeVisible();
  const largeur = await photo.evaluate((img: HTMLImageElement) => img.naturalWidth);
  expect(largeur).toBe(1600);
});

test('export puis import dans un navigateur vierge ; un fichier invalide est refusé', async ({
  page,
  browser,
}) => {
  await bibliotheque(page);
  await creerHachis(page);
  await page.getByRole('button', { name: 'Enregistrer la recette' }).click();
  // Attendre la fin de l’enregistrement (fiche affichée) avant de changer d’écran.
  await expect(page.locator('main h1')).toHaveText('Hachis parmentier de maman');
  await page.goto('./#recettes');
  await expect(cartes(page)).toHaveCount(22);
  const telechargement = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter' }).click();
  const fichier = await (await telechargement).path();
  const contenu = readFileSync(fichier, 'utf8');
  expect(JSON.parse(contenu).recettes).toHaveLength(22);

  const vierge = await (await browser.newContext()).newPage();
  await bibliotheque(vierge);
  const champ = vierge.locator('input[type="file"][accept*="json"]');
  await champ.setInputFiles({
    name: 'export.json',
    mimeType: 'application/json',
    buffer: Buffer.from(contenu),
  });
  await expect(vierge.getByRole('status').filter({ hasText: /importée/ })).toHaveText(
    /1\srecette importée, 21\sdéjà présentes ignorées/,
  );
  await expect(cartes(vierge)).toHaveCount(22);

  await champ.setInputFiles({
    name: 'casse.json',
    mimeType: 'application/json',
    buffer: Buffer.from('pas du json'),
  });
  await expect(vierge.getByRole('alert')).toContainText('Import refusé, rien n’a été modifié.');
  const abime = JSON.parse(contenu);
  abime.recettes[0].nom = '';
  abime.recettes[0].id = 'nouvelle';
  await champ.setInputFiles({
    name: 'abime.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(abime)),
  });
  await expect(vierge.getByRole('alert')).toContainText('nom manquant');
  await expect(cartes(vierge)).toHaveCount(22);
  await vierge.context().close();
});

for (const theme of ['light', 'dark'] as const) {
  for (const taille of TAILLES) {
    test(`recettes à ${taille.width} px en thème ${theme} : bibliothèque, fiche et éditeur`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize(taille);
      await bibliotheque(page);
      expect(await debordement(page), 'bibliothèque').toBe(0);
      expect(await violationsAxe(page), 'bibliothèque').toEqual([]);

      await page.goto('./#recettes/depart-brandade');
      await expect(page.locator('main h1')).toHaveText('Brandade de morue');
      expect(await debordement(page), 'fiche').toBe(0);
      expect(await violationsAxe(page), 'fiche').toEqual([]);

      await page.goto('./#recettes');
      await creerHachis(page);
      await expect(page.getByRole('dialog').locator('.etape-editable')).toHaveCount(5);
      expect(await violationsAxe(page), 'éditeur').toEqual([]);
      const debordeEditeur = await page
        .getByRole('dialog')
        .evaluate(
          (d) =>
            d.scrollWidth -
            d.clientWidth +
            (d.querySelector('.editeur-corps')?.scrollWidth ?? 0) -
            (d.querySelector('.editeur-corps')?.clientWidth ?? 0),
        );
      expect(debordeEditeur, 'éditeur').toBe(0);
    });
  }
}
