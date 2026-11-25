import { signal } from '@preact/signals';
import type { Recette } from '../../domaine/modele';

/** Éditeur ouvert : recette à modifier (null pour une nouvelle), et élément à refocaliser à la fermeture. */
export const editeur = signal<{
  recetteId: string | null;
  /** Recette pas encore enregistrée servant de point de départ (import web). */
  modele: Recette | null;
  retour: HTMLElement | null;
} | null>(null);

export function ouvrirEditeur(recetteId: string | null, modele: Recette | null = null): void {
  editeur.value = { recetteId, modele, retour: document.activeElement as HTMLElement | null };
}

export function fermerEditeur(): void {
  const retour = editeur.value?.retour;
  editeur.value = null;
  queueMicrotask(() => retour?.isConnected && retour.focus());
}
