import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const ECRANS = [
  { id: 'semaine', nom: 'Semaine' },
  { id: 'courses', nom: 'Courses' },
  { id: 'session', nom: 'Session' },
  { id: 'frigo', nom: 'Frigo' },
  { id: 'recettes', nom: 'Recettes' },
] as const;

export const TAILLES = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 820, height: 1180 },
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
] as const;

export const NOMS_THEME = {
  systeme: 'Thème\u00a0: celui du système. Changer de thème',
  light: 'Thème\u00a0: clair. Changer de thème',
  dark: 'Thème\u00a0: sombre. Changer de thème',
} as const;

/** Ouvre l’application et attend la coque. */
export async function ouvrir(page: Page, ancre = ''): Promise<void> {
  await page.goto(`./${ancre}`);
  await expect(page.locator('main h1')).toHaveCount(1);
}

export async function violationsAxe(page: Page): Promise<string[]> {
  const resultat = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return resultat.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

export function debordement(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}
