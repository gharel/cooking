import { aujourdhui, type DateISO } from './dates';
import type { Recette } from './modele';

/** Où en est la sauvegarde des recettes (export) sur cet appareil. */
export interface EtatSauvegarde {
  /** Date et heure (ISO) du dernier export complet ; null s’il n’y en a jamais eu. */
  derniere: string | null;
  /** « Plus tard » : pas de rappel avant ce jour. */
  reporteeJusquA: DateISO | null;
}

export const ETAT_SAUVEGARDE_VIDE: EtatSauvegarde = { derniere: null, reporteeJusquA: null };

/** Âge de la plus ancienne modification non sauvegardée avant un rappel ; durée d’un « Plus tard ». */
export const DELAI_RAPPEL_JOURS = 7;

const JOUR_MS = 86_400_000;

/**
 * Recette créée ou modifiée après la dernière sauvegarde. Une recette de départ jamais modifiée se
 * réinstalle d’elle-même : inutile de la sauvegarder.
 */
export function estASauvegarder(r: Recette, derniere: string | null): boolean {
  if (r.origine.type === 'depart' && r.modifieLe === r.creeLe) return false;
  if (derniere === null) return true;
  return !(Date.parse(r.modifieLe) <= Date.parse(derniere));
}

export interface RappelSauvegarde {
  /** Recettes qui n’existent que sur cet appareil. */
  nombre: number;
  derniere: string | null;
}

/** Rappel à afficher maintenant, ou null : rien à sauvegarder, modifications trop récentes ou rappel reporté. */
export function rappelSauvegarde(
  recettes: readonly Recette[],
  etat: EtatSauvegarde,
  maintenant: Date,
): RappelSauvegarde | null {
  const liste = recettes.filter((r) => estASauvegarder(r, etat.derniere));
  if (liste.length === 0) return null;
  if (etat.reporteeJusquA && aujourdhui(maintenant) < etat.reporteeJusquA) return null;
  // Une date illisible compte comme ancienne : mieux vaut un rappel de trop qu’une recette perdue.
  const dates = liste.map((r) => Date.parse(r.modifieLe)).map((d) => (Number.isFinite(d) ? d : -Infinity));
  if (maintenant.getTime() - Math.min(...dates) < DELAI_RAPPEL_JOURS * JOUR_MS) return null;
  return { nombre: liste.length, derniere: etat.derniere };
}
