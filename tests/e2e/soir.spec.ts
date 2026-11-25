import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { debordement, violationsAxe } from './outils';

// Mardi 1er décembre 2026, 17 h : semaine de la fournée du dimanche 29 novembre.
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-12-01T17:00:00') });
});

const widget = (page: Page) => page.locator('.ce-soir');

async function accueil(page: Page): Promise<void> {
  await page.goto('./#semaine');
  await expect(widget(page).getByRole('heading', { level: 2 })).toBeVisible();
}

test('rien de prévu : la roulette décide, « Ce soir, c’est ça » le retient', async ({ page }) => {
  await accueil(page);
  await expect(widget(page).getByRole('heading', { level: 2 })).toHaveText('Rien de prévu');
  await widget(page).getByRole('button', { name: 'Roulette' }).click();
  const dialogue = page.getByRole('dialog', { name: 'Roulette' });
  await dialogue.getByRole('button', { name: 'À cuisiner' }).click();
  await expect(dialogue).toContainText(/8\spossibilités/);
  await dialogue.getByRole('button', { name: 'Lancer la roulette' }).click();
  await page.clock.runFor(2000);
  const nom = (await dialogue.locator('.roulette-nom').textContent()) ?? '';
  expect(nom.length).toBeGreaterThan(0);
  await expect(dialogue.getByRole('link', { name: 'Voir la recette' })).toBeVisible();
  await dialogue.getByRole('button', { name: 'Ce soir, c’est ça' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(widget(page).getByRole('heading', { level: 2 })).toHaveText(nom);
  await expect(widget(page)).toContainText('À cuisiner ce soir');
  await expect(widget(page).getByRole('button', { name: 'Roulette' })).toBeFocused();
  await page.reload();
  await expect(widget(page).getByRole('heading', { level: 2 })).toHaveText(nom);
  await widget(page).getByRole('button', { name: 'Changer d’avis' }).click();
  await expect(widget(page).getByRole('heading', { level: 2 })).toHaveText('Rien de prévu');
});

test('nos adresses : les trois de départ, une adresse ajoutée gardée, choisie pour ce soir', async ({
  page,
}) => {
  await accueil(page);
  await widget(page).getByRole('button', { name: 'Nos adresses' }).click();
  const dialogue = page.getByRole('dialog');
  await expect(dialogue.locator('.adresses li strong')).toHaveText([
    'Burger King',
    'Gino Pizza',
    'Indi Kitch',
  ]);
  await dialogue.getByRole('button', { name: 'Ajouter une adresse' }).click();
  await dialogue.getByLabel('Nom').fill('Le snack du coin');
  await dialogue.getByLabel('Type').fill('Sandwichs');
  await dialogue.getByLabel('Téléphone').fill('01 02 03 04 05');
  await dialogue.getByLabel('Site ou menu').fill('snack.example');
  await dialogue.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(dialogue.locator('.adresses li strong')).toHaveText([
    'Burger King',
    'Gino Pizza',
    'Indi Kitch',
    'Le snack du coin',
  ]);
  const snack = dialogue.locator('.adresses li', { hasText: 'Le snack du coin' });
  await expect(snack.getByRole('link', { name: /^Appeler/ })).toHaveAttribute('href', 'tel:0102030405');
  await expect(snack.getByRole('link', { name: /^Site/ })).toHaveAttribute('href', 'https://snack.example');
  expect(await violationsAxe(page)).toEqual([]);
  await snack.getByRole('button', { name: /^Ce soir/ }).click();
  await expect(widget(page).getByRole('heading', { level: 2 })).toHaveText('Le snack du coin');
  await expect(widget(page).getByRole('link', { name: /^Appeler/ })).toBeVisible();

  await page.reload();
  await expect(widget(page).getByRole('heading', { level: 2 })).toHaveText('Le snack du coin');
  page.on('dialog', (d) => void d.accept());
  await widget(page).getByRole('button', { name: 'Nos adresses' }).click();
  await page.getByRole('button', { name: 'Supprimer Burger King' }).click();
  await expect(page.getByRole('dialog').locator('.adresses li')).toHaveCount(3);
  await page.reload();
  await widget(page).getByRole('button', { name: 'Nos adresses' }).click();
  await expect(page.getByRole('dialog').locator('.adresses li')).toHaveCount(3);
});

test('une recette du soir au planning : widget, courses, agenda', async ({ page }) => {
  await page.goto('./#semaine');
  await page.getByRole('combobox', { name: 'Repas du mardi soir' }).waitFor();
  // La semaine affichée est celle de la prochaine session (lundi 7 au dimanche 13 décembre).
  await page
    .getByRole('combobox', { name: 'Repas du mercredi soir' })
    .selectOption({ label: 'Croque-monsieur' });
  await page
    .getByRole('combobox', { name: 'Repas du jeudi soir' })
    .selectOption({ label: 'Croque-monsieur' });
  await page.goto('./#courses');
  await expect(page.locator('.sous-titre')).toContainText('et les recettes du soir');
  await expect(page.locator('main')).toContainText(/8\stranches de pain de mie/);
  await page.goto('./#semaine');
  await expect(widget(page)).toContainText('Rien de prévu');

  // Le jour venu, le widget affiche le croque-monsieur.
  await page.clock.setSystemTime(new Date('2026-12-09T18:00:00'));
  await page.reload();
  await expect(widget(page).getByRole('heading', { level: 2 })).toHaveText('Croque-monsieur');
  await expect(widget(page)).toContainText('Demain soir : Croque-monsieur');

  await widget(page).getByText('Être prévenu du dîner').click();
  const [telechargement] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Ajouter les dîners à mon agenda' }).click(),
  ]);
  expect(telechargement.suggestedFilename()).toBe('fournee-diners.ics');
  const ics = readFileSync((await telechargement.path()) ?? '', 'utf8');
  expect(ics).toContain('SUMMARY:Dîner : Croque-monsieur');
  expect(ics).toContain('DTSTART:20261209T193000');
  expect(ics).toContain('DTSTART:20261210T193000');
});

test('rappel du dîner : l’autorisation accordée active la notification à l’heure dite', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['notifications']);
  await page.addInitScript(() => {
    const vues: string[] = [];
    (window as unknown as { notifications: string[] }).notifications = vues;
    class FausseNotification {
      static permission = 'granted';
      static requestPermission = () => Promise.resolve('granted');
      onclick: (() => void) | null = null;
      constructor(titre: string) {
        vues.push(titre);
      }
      close() {}
    }
    Object.defineProperty(window, 'Notification', { value: FausseNotification });
  });
  await accueil(page);
  await widget(page).getByText('Être prévenu du dîner').click();
  await page.getByLabel('Heure du dîner', { exact: true }).fill('17:30');
  await page.getByLabel('Heure du dîner', { exact: true }).blur();
  await page.getByRole('checkbox', { name: 'Me prévenir à l’heure du dîner' }).check();
  await expect(page.getByRole('checkbox', { name: 'Me prévenir à l’heure du dîner' })).toBeChecked();
  await page.clock.runFor(31 * 60_000);
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { notifications: string[] }).notifications))
    .toEqual(['Ce soir : rien de prévu']);
});

for (const theme of ['light', 'dark'] as const)
  for (const largeur of [360, 1280])
    test(`widget et roulette à ${largeur} px en thème ${theme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({ width: largeur, height: 800 });
      await accueil(page);
      await widget(page).getByText('Être prévenu du dîner').click();
      expect(await debordement(page)).toBe(0);
      expect(await violationsAxe(page)).toEqual([]);
      await widget(page).getByRole('button', { name: 'Roulette' }).click();
      await page.getByRole('button', { name: 'Lancer la roulette' }).click();
      await page.clock.runFor(2000);
      await expect(page.getByRole('button', { name: 'Ce soir, c’est ça' })).toBeVisible();
      expect(await debordement(page)).toBe(0);
      expect(await violationsAxe(page)).toEqual([]);
    });
