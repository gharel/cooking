import type { NomIcone } from './icones';

export const ECRANS = [
  { id: 'semaine', nom: 'Semaine', icone: 'calendrier' },
  { id: 'courses', nom: 'Courses', icone: 'courses' },
  { id: 'session', nom: 'Session', icone: 'flamme' },
  { id: 'frigo', nom: 'Frigo', icone: 'frigo' },
  { id: 'recettes', nom: 'Recettes', icone: 'livre' },
] as const satisfies readonly { id: string; nom: string; icone: NomIcone }[];

export type IdEcran = (typeof ECRANS)[number]['id'];
export type OngletFrigo = 'plats' | 'reste';
export interface Route {
  ecran: IdEcran;
  onglet?: OngletFrigo;
}

/** Ancres qui ouvrent un écran sur un onglet précis (ou d’anciens noms d’écran). */
const ALIAS: Readonly<Record<string, Route>> = {
  reste: { ecran: 'frigo', onglet: 'reste' },
  stock: { ecran: 'frigo', onglet: 'plats' },
};

/** Traduit l’ancre de l’adresse (#courses, #reste…) en écran ; Semaine par défaut. */
export function lireAncre(ancre: string): Route {
  const id = ancre.replace(/^#/, '');
  const alias = ALIAS[id];
  if (alias) return { ...alias };
  const ecran = ECRANS.find((e) => e.id === id);
  return { ecran: ecran ? ecran.id : 'semaine' };
}
