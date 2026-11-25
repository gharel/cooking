import { Dexie, type EntityTable } from 'dexie';
import type { Recette } from '../domaine/modele';

export interface Photo {
  id: string;
  blob: Blob;
}

export interface Reglage {
  cle: string;
  valeur: unknown;
}

/** Base locale (IndexedDB). Schéma versionné : toute évolution ajoute une version et sa migration. */
export class BaseFournee extends Dexie {
  recettes!: EntityTable<Recette, 'id'>;
  photos!: EntityTable<Photo, 'id'>;
  reglages!: EntityTable<Reglage, 'cle'>;

  constructor(nom = 'fournee') {
    super(nom);
    this.version(1).stores({ recettes: 'id, nom', photos: 'id', reglages: 'cle' });
  }
}

let base: BaseFournee | undefined;
export const obtenirBase = (): BaseFournee => (base ??= new BaseFournee());

export const nouvelIdentifiant = (prefixe: string): string =>
  `${prefixe}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
