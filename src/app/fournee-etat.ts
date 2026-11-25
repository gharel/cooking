import { signal } from '@preact/signals';
import type { Fournee } from '../domaine/fournee';
import { REGLAGES_PAR_DEFAUT, type Reglages } from '../domaine/reglages';
import { obtenirBase } from '../donnees/base';
import { enregistrerReglages, fourneeCourante, lireReglages } from '../donnees/fournees';

export const fournee = signal<Fournee | null>(null);
export const reglages = signal<Reglages>(REGLAGES_PAR_DEFAUT);

export async function demarrerFournee(): Promise<void> {
  const base = obtenirBase();
  reglages.value = await lireReglages(base);
  fournee.value = await fourneeCourante(base);
}

let ecritures: Promise<void> = Promise.resolve();

/**
 * Applique une modification à la fournée courante, tout de suite en mémoire (la suivante part de celle-ci),
 * puis l’enregistre ; les écritures sont mises en file dans l’ordre : aucune ne peut en écraser une plus récente.
 */
export function modifierFournee(modification: (f: Fournee) => Fournee): Promise<void> {
  const actuelle = fournee.value;
  if (!actuelle) return Promise.resolve();
  const nouvelle = { ...modification(actuelle), modifieLe: new Date().toISOString() };
  fournee.value = nouvelle;
  ecritures = ecritures
    .then(() => obtenirBase().fournees.put(nouvelle))
    .then(
      () => undefined,
      () => undefined,
    );
  return ecritures;
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
