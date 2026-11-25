import { signal } from '@preact/signals';

/** Éditeur ouvert : recette à modifier (null pour une nouvelle), et élément à refocaliser à la fermeture. */
export const editeur = signal<{ recetteId: string | null; retour: HTMLElement | null } | null>(null);

export function ouvrirEditeur(recetteId: string | null): void {
  editeur.value = { recetteId, retour: document.activeElement as HTMLElement | null };
}

export function fermerEditeur(): void {
  const retour = editeur.value?.retour;
  editeur.value = null;
  queueMicrotask(() => retour?.isConnected && retour.focus());
}
