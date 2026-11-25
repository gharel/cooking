import { Dexie, type EntityTable } from 'dexie';
import type { Fournee } from '../domaine/fournee';
import type { Recette } from '../domaine/modele';
import type { Plat, Reste } from '../domaine/stock';

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
  fournees!: EntityTable<Fournee, 'id'>;
  plats!: EntityTable<Plat, 'id'>;
  restes!: EntityTable<Reste, 'id'>;

  constructor(nom = 'fournee') {
    super(nom);
    this.version(1).stores({ recettes: 'id, nom', photos: 'id', reglages: 'cle' });
    // v2 (lots 2 à 4) : fournées, plats préparés, ingrédients restants. Simple ajout de tables.
    this.version(2).stores({ fournees: 'id, statut', plats: 'id, lieu', restes: 'id' });
  }
}

let base: BaseFournee | undefined;
export const obtenirBase = (): BaseFournee => (base ??= new BaseFournee());

export const nouvelIdentifiant = (prefixe: string): string =>
  `${prefixe}-${globalThis.crypto.randomUUID().slice(0, 8)}`;
