import { signal } from '@preact/signals';
import type { Recette } from '../domaine/modele';
import { obtenirBase } from '../donnees/base';
import { installerRecettesDeDepart, listerRecettes, recettesDeDepartManquantes } from '../donnees/recettes';

export const recettes = signal<Recette[]>([]);
export const chargee = signal(false);
export const manquantes = signal(0);
/** Stockage persistant accordé ? null tant qu’on ne sait pas. */
export const persistant = signal<boolean | null>(null);

export async function rafraichir(): Promise<void> {
  const base = obtenirBase();
  recettes.value = await listerRecettes(base);
  manquantes.value = await recettesDeDepartManquantes(base);
  chargee.value = true;
}

/** Au démarrage : recettes de départ (une seule fois), lecture de la bibliothèque, stockage persistant. */
export async function demarrerBibliotheque(): Promise<void> {
  await installerRecettesDeDepart(obtenirBase());
  await rafraichir();
  try {
    const stockage = navigator.storage;
    persistant.value = (await stockage?.persisted?.()) || ((await stockage?.persist?.()) ?? false);
  } catch {
    persistant.value = false;
  }
}
