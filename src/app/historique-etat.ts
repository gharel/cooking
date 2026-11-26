import { signal } from '@preact/signals';
import type { Fournee } from '../domaine/fournee';
import { obtenirBase } from '../donnees/base';
import { fourneesTerminees } from '../donnees/fournees';

/**
 * Sessions terminées, chargées au démarrage. Module à part de `session-etat` : celui-ci tire l’ordonnanceur,
 * qui n’a rien à faire dans le JavaScript de démarrage.
 */

/** Dernière session terminée (bilan, planning des repas de la semaine en cours). */
export const derniereSession = signal<Fournee | null>(null);
/** Toutes les fournées terminées, de la plus récente à la plus ancienne (statistiques). */
export const historique = signal<Fournee[]>([]);

export async function chargerDerniereSession(): Promise<void> {
  historique.value = await fourneesTerminees(obtenirBase());
  derniereSession.value = historique.value[0] ?? null;
}

/** Ajoute une session qui vient de se terminer. */
export function ajouterAHistorique(terminee: Fournee): void {
  derniereSession.value = terminee;
  historique.value = [terminee, ...historique.value];
}
