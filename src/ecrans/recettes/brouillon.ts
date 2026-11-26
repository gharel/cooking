import type { Rayon } from '../../domaine/dictionnaire';
import { analyserIngredient } from '../../domaine/ingredients';
import type { Etape, Recette, TypeOrigine } from '../../domaine/modele';
import { nouvelIdentifiant } from '../../donnees/base';

export interface Brouillon {
  nom: string;
  sousTitre: string;
  portions: number;
  vegetarien: boolean;
  soir: boolean;
  origine: TypeOrigine;
  de: string;
  mot: string;
  texteOriginal: string;
  /** Une ligne par ingrédient, telle qu’écrite. */
  ingredients: string;
  /** Rayon choisi à la main, par ligne d’ingrédient. */
  rayons: Record<string, Rayon>;
  etapes: Etape[];
  frigoJours: number;
  congelable: boolean;
  congelateurMois: number;
  note: string;
  photos: string[];
  nouvelles: { id: string; blob: Blob }[];
}

export function depuisRecette(r: Recette | undefined): Brouillon {
  return {
    nom: r?.nom ?? '',
    sousTitre: r?.sousTitre ?? '',
    portions: r?.portions ?? 4,
    vegetarien: r?.vegetarien ?? false,
    soir: r?.soir ?? false,
    origine: r?.origine.type ?? 'famille',
    de: r?.origine.de ?? '',
    mot: r?.origine.mot ?? '',
    texteOriginal: r?.texteOriginal ?? '',
    ingredients: (r?.ingredients ?? []).map((i) => i.texte).join('\n'),
    rayons: {},
    etapes: structuredClone(r?.etapes ?? []),
    frigoJours: r?.conservation.frigoJours ?? 3,
    congelable: r ? r.conservation.congelateurMois !== null : true,
    congelateurMois: r?.conservation.congelateurMois ?? 3,
    note: r?.note ?? '',
    photos: [...(r?.photos ?? [])],
    nouvelles: [],
  };
}

export const lignes = (texte: string) =>
  texte
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export const ouNull = (s: string) => (s.trim() === '' ? null : s.trim());

export function versRecette(
  b: Brouillon,
  existante: Recette | undefined,
  depart: Recette | undefined,
): Recette {
  const maintenant = new Date().toISOString();
  const ingredients = lignes(b.ingredients).map((ligne) => {
    const connu = depart?.ingredients.find((i) => i.texte === ligne);
    const ingredient = connu ?? analyserIngredient(ligne);
    const rayon = b.rayons[ligne];
    return rayon ? { ...ingredient, rayon } : ingredient;
  });
  return {
    id: existante?.id ?? nouvelIdentifiant('recette'),
    nom: b.nom.trim(),
    sousTitre: ouNull(b.sousTitre),
    note: ouNull(b.note),
    portions: Math.max(1, Math.round(b.portions) || 4),
    vegetarien: b.vegetarien,
    soir: b.soir,
    ingredients,
    etapes: b.etapes.map((e) => ({ ...e, texte: e.texte.trim() })).filter((e) => e.texte !== ''),
    conservation: {
      frigoJours: Math.max(0, Math.round(b.frigoJours)),
      congelateurMois: b.congelable ? Math.max(1, Math.round(b.congelateurMois)) : null,
    },
    origine: {
      type: b.origine,
      de: ouNull(b.de),
      mot: ouNull(b.mot),
      source: depart?.origine.source ?? null,
    },
    texteOriginal: b.texteOriginal.trim() === '' ? null : b.texteOriginal,
    photos: [...b.photos, ...b.nouvelles.map((p) => p.id)],
    creeLe: existante?.creeLe ?? maintenant,
    modifieLe: maintenant,
  };
}

export const empreinte = (b: Brouillon) => JSON.stringify({ ...b, nouvelles: b.nouvelles.map((p) => p.id) });
