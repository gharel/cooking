import type { Rayon } from './dictionnaire';

export type Poste = 'plan' | 'feu' | 'four' | 'repos';
export type TypeOrigine = 'famille' | 'maison' | 'depart' | 'web' | 'livre';

export const POSTES: Readonly<Record<Poste, string>> = {
  plan: 'Plan de travail',
  feu: 'Feu',
  four: 'Four',
  repos: 'Repos',
};

export const ORIGINES: Readonly<Record<TypeOrigine, string>> = {
  famille: 'De la famille',
  maison: 'Notre recette',
  depart: 'Recette de départ',
  web: 'Du web',
  livre: 'D’un livre',
};

export interface Ingredient {
  /** Ligne telle qu’écrite (« 1 boîte de tomates concassées (400 g) »), affichée telle quelle. */
  texte: string;
  quantite: number | null;
  unite: string | null;
  nom: string;
  precision: string | null;
  facultatif: boolean;
  cle: string;
  rayon: Rayon;
  /** Sous-recette : la lasagne utilise la bolognaise. */
  recetteId: string | null;
}

export interface Etape {
  id: string;
  texte: string;
  poste: Poste;
  dureeMin: number;
  /** Occupe le cuisinier ; sinon n’occupe que son poste. */
  active: boolean;
  apres: string[];
  facultative: boolean;
  anticiper: 'veille' | null;
  /** Durée devinée par l’analyseur, pas encore confirmée. */
  devinee: boolean;
  sousRecetteId: string | null;
}

export interface Origine {
  type: TypeOrigine;
  de: string | null;
  mot: string | null;
  source: string | null;
}

export interface Recette {
  id: string;
  nom: string;
  /** Précision affichée sous le nom (« Pommes de terre et patates douces »). */
  sousTitre: string | null;
  /** Conseil de conservation ou de préparation. */
  note: string | null;
  portions: number;
  vegetarien: boolean;
  /** Recette du soir : à cuisiner le jour même, hors session. */
  soir: boolean;
  ingredients: Ingredient[];
  etapes: Etape[];
  conservation: { frigoJours: number; congelateurMois: number | null };
  origine: Origine;
  /** Texte libre saisi, conservé à l’identique (recettes de famille). */
  texteOriginal: string | null;
  photos: string[];
  creeLe: string;
  modifieLe: string;
}

export const estCongelable = (r: Recette): boolean => r.conservation.congelateurMois !== null;
export const passeAuFour = (r: Recette): boolean => r.etapes.some((e) => e.poste === 'four');
export const estAStructurer = (r: Recette): boolean => r.etapes.length === 0;
