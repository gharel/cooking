import { signal } from '@preact/signals';
import type { Fournee } from '../domaine/fournee';
import { REGLAGES_PAR_DEFAUT, type Reglages } from '../domaine/reglages';
import { obtenirBase } from '../donnees/base';
import { enregistrerFournee, enregistrerReglages, fourneeCourante, lireReglages } from '../donnees/fournees';

export const fournee = signal<Fournee | null>(null);
export const reglages = signal<Reglages>(REGLAGES_PAR_DEFAUT);

export async function demarrerFournee(): Promise<void> {
  const base = obtenirBase();
  reglages.value = await lireReglages(base);
  fournee.value = await fourneeCourante(base);
}

/** Applique une modification à la fournée courante et l’enregistre. */
export async function modifierFournee(modification: (f: Fournee) => Fournee): Promise<void> {
  const actuelle = fournee.value;
  if (!actuelle) return;
  const nouvelle = modification(actuelle);
  fournee.value = nouvelle;
  fournee.value = await enregistrerFournee(obtenirBase(), nouvelle);
}

export async function modifierReglages(modification: (r: Reglages) => Reglages): Promise<void> {
  const nouveaux = modification(reglages.value);
  reglages.value = nouveaux;
  await enregistrerReglages(obtenirBase(), nouveaux);
}

/** Après une session terminée : une nouvelle fournée en préparation. */
export async function nouvelleFourneeCourante(): Promise<void> {
  fournee.value = await fourneeCourante(obtenirBase());
}
