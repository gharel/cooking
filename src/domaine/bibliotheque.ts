import { dureeActive } from './durees';
import { estCongelable, passeAuFour, type Recette } from './modele';
import { normaliser } from './texte';

export type Filtre = 'soir' | 'famille' | 'congelable' | 'vegetarien' | 'four' | 'rapide';

export const FILTRES: readonly { id: Filtre; nom: string }[] = [
  { id: 'soir', nom: 'Du soir' },
  { id: 'famille', nom: 'Famille et maison' },
  { id: 'congelable', nom: 'Congelable' },
  { id: 'vegetarien', nom: 'Végétarien' },
  { id: 'four', nom: 'Four' },
  { id: 'rapide', nom: '15 min actives ou moins' },
];

export function correspond(recette: Recette, filtre: Filtre): boolean {
  switch (filtre) {
    case 'soir':
      return recette.soir;
    case 'famille':
      return recette.origine.type === 'famille' || recette.origine.type === 'maison';
    case 'congelable':
      return estCongelable(recette);
    case 'vegetarien':
      return recette.vegetarien;
    case 'four':
      return passeAuFour(recette);
    case 'rapide':
      return recette.etapes.length > 0 && dureeActive(recette) <= 15;
  }
}

/** Recherche sans accents ni casse dans le nom, filtres cumulés, tri alphabétique français. */
export function filtrerRecettes(
  recettes: readonly Recette[],
  texte: string,
  filtres: readonly Filtre[],
): Recette[] {
  const cherche = normaliser(texte.trim());
  return recettes
    .filter((r) => normaliser(r.nom).includes(cherche) && filtres.every((f) => correspond(r, f)))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}
