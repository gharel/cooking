import type { DateISO } from './dates';

export type Lieu = 'frigo' | 'congelateur';

/** Plat préparé, au frigo ou au congélateur. */
export interface Plat {
  id: string;
  recetteId: string | null;
  nom: string;
  portions: number;
  lieu: Lieu;
  prepareLe: DateISO;
  /** Date limite conseillée (à consommer au plus tard ce jour-là). */
  limite: DateISO;
  fourneeId: string | null;
}

/** Ingrédient qui reste dans le frigo. */
export interface Reste {
  id: string;
  nom: string;
  cle: string;
  quantite: number | null;
  unite: string | null;
  vite: boolean;
  ajouteLe: DateISO;
}
