// Captures de docs/captures/ : l’application construite (`npm run build` avant), données fictives, horloge fixée.
// Recettes de départ et prénoms de test seulement : aucune donnée personnelle (règle « Dépôt public »).
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const PORT = 4183;
const serveur = await preview({ preview: { port: PORT, strictPort: true } });
// Le format des champs date et heure suit la langue du navigateur, pas la locale du contexte.
const navigateur = await chromium.launch({ args: ['--lang=fr-FR'] });
const PLATS = ['Chili con carne', 'Dahl de lentilles', 'Gratin dauphinois', 'Quiche lorraine'];

/** Page neuve (base vide) au thème et à la taille voulus, dimanche 29 novembre 2026 à 10 h. */
async function ouvrir(theme, width, height) {
  const contexte = await navigateur.newContext({
    baseURL: `http://localhost:${PORT}/cooking/`,
    viewport: { width, height },
    colorScheme: theme,
    reducedMotion: 'reduce',
    locale: 'fr-FR',
  });
  const page = await contexte.newPage();
  await page.clock.install({ time: new Date('2026-11-29T10:00:00') });
  page.on('dialog', (d) => void d.accept());
  return page;
}

async function aller(page, ancre) {
  await page.goto(`./${ancre}`);
  await page.locator('main h1').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
}

async function preparerFournee(page) {
  await aller(page, '#semaine');
  await page.locator('.carte-session').waitFor();
  for (const nom of PLATS) {
    await page.getByRole('button', { name: 'Ajouter un plat' }).click();
    const dialogue = page.getByRole('dialog');
    await dialogue.getByRole('searchbox').fill(nom);
    await dialogue.getByRole('button', { name: new RegExp(`^${nom}`) }).click();
    await dialogue.getByRole('button', { name: 'Ajouter à la fournée' }).click();
    await page.getByRole('dialog').waitFor({ state: 'detached' });
  }
  await page.getByRole('button', { name: 'Répartir automatiquement' }).click();
}

/**
 * Pleine page : la fenêtre prend la hauteur du document (une capture `fullPage` laisserait le bandeau et la
 * barre d’onglets au milieu). Les annonces passagères sont masquées.
 */
async function capturer(page, nom, pleinePage = true) {
  await page.addStyleTag({ content: '.annonce-zone { display: none !important; }' });
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  if (pleinePage) {
    const hauteur = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: page.viewportSize().width, height: hauteur });
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: `docs/captures/${nom}.png` });
  console.log(`docs/captures/${nom}.png`);
  await page.context().close();
}

try {
  let page = await ouvrir('dark', 390, 844);
  await preparerFournee(page);
  await aller(page, '#semaine');
  await capturer(page, 'semaine-390-dark');

  page = await ouvrir('light', 1280, 720);
  await preparerFournee(page);
  await aller(page, '#session');
  await page.getByLabel('Prénom de la personne 1').fill('Guillaume');
  await page.getByRole('button', { name: 'Ajouter une personne' }).click();
  await page.getByLabel('Prénom de la personne 2').fill('Hélène');
  await page.locator('.repartition-personne').nth(1).waitFor();
  await capturer(page, 'session-1280-light');

  page = await ouvrir('light', 390, 844);
  await preparerFournee(page);
  await aller(page, '#session');
  await page.getByRole('button', { name: 'Lancer la session' }).click();
  await page.getByRole('button', { name: 'Terminer la session' }).click();
  await page.locator('.bilan').waitFor();
  await aller(page, '#frigo');
  await page.locator('.plat').first().waitFor();
  await capturer(page, 'frigo-390-light');

  page = await ouvrir('light', 1280, 720);
  await aller(page, '#reste');
  await page
    .getByLabel('Ajouter un ingrédient')
    .fill('½ courgette, 100 g de feta, 6 œufs, 1 poivron, 1 oignon, 10 cl de lait');
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await page.locator('.idee').first().waitFor();
  await capturer(page, 'reste-1280-light');

  page = await ouvrir('dark', 1280, 720);
  await aller(page, '#recettes');
  await page.locator('.carte-recette').nth(20).waitFor();
  await capturer(page, 'recettes-1280-dark', false);

  page = await ouvrir('dark', 390, 844);
  await aller(page, '#recettes');
  await page.getByRole('button', { name: 'Nouvelle recette' }).click();
  const editeur = page.getByRole('dialog');
  await editeur.getByLabel('Nom').fill('Hachis parmentier');
  await editeur.getByLabel('De qui ?').fill('Mamie');
  await editeur
    .getByLabel('La recette, telle qu’on la raconte')
    .fill(
      'Cuire 1 kg de pommes de terre 25 min dans l’eau salée. Pendant ce temps, faire revenir 2 oignons puis 500 g de bœuf haché. Écraser les pommes de terre avec 20 cl de lait et 50 g de beurre. Monter dans le plat et gratiner 20 min à 200 °C.',
    );
  await editeur.getByRole('button', { name: 'Proposer les étapes' }).click();
  await editeur.locator('.etape-editable').first().waitFor();
  await capturer(page, 'editeur-390-dark', false);
} finally {
  await navigateur.close();
  await new Promise((fin) => serveur.httpServer.close(fin));
}
