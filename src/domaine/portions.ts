import type { Ingredient } from './modele';

/** Unités qu’on n’achète pas en morceaux : on arrondit à l’unité supérieure. */
const ENTIERES = new Set(['boîte', 'sachet', 'tablette', 'carré']);
const NOMS_ENTIERS = ['pate brisee', 'pate feuilletee', 'camembert'];
const MASSES_VOLUMES = new Set(['g', 'kg', 'cl', 'ml', 'l', 'dl']);

const FRACTIONS: [number, string][] = [
  [0.25, '¼'],
  [0.5, '½'],
  [0.75, '¾'],
];

/** 0,5 donne « ½ », 1,5 donne « 1 ½ », 2,25 donne « 2 ¼ », 1,2 donne « 1,2 ». */
export function formaterQuantite(q: number): string {
  const entier = Math.floor(q + 1e-9);
  const reste = q - entier;
  if (reste < 1e-6) return String(entier);
  const fraction = FRACTIONS.find(([v]) => Math.abs(v - reste) < 1e-6)?.[1];
  if (fraction) return entier === 0 ? fraction : `${entier} ${fraction}`;
  return String(Math.round(q * 10) / 10).replace('.', ',');
}

/** Arrondi lisible selon l’unité : 5 g près sous 100 g, 10 g au-delà, ¼ pour les cuillères, ½ pour les pièces. */
export function arrondirQuantite(q: number, unite: string | null, nom: string): number {
  if (unite === 'g' || unite === 'ml')
    return q < 100 ? Math.max(5, Math.round(q / 5) * 5) : Math.round(q / 10) * 10;
  if (unite === 'cl') return Math.max(1, Math.round(q));
  if (unite === 'kg' || unite === 'l') return Math.round(q * 10) / 10;
  if (unite && ENTIERES.has(unite)) return Math.ceil(q - 1e-9);
  const n = nom
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  if (!unite && NOMS_ENTIERS.some((e) => n.includes(e))) return Math.ceil(q - 1e-9);
  if (unite === 'c. à s.' || unite === 'c. à c.' || unite === 'pincée')
    return Math.max(0.25, Math.round(q * 4) / 4);
  return Math.max(0.5, Math.round(q * 2) / 2);
}

const PLURIELS_UNITES: Readonly<Record<string, string>> = {
  gousse: 'gousses',
  botte: 'bottes',
  boîte: 'boîtes',
  branche: 'branches',
  feuille: 'feuilles',
  tranche: 'tranches',
  carré: 'carrés',
  morceau: 'morceaux',
  sachet: 'sachets',
  tête: 'têtes',
  brin: 'brins',
  poignée: 'poignées',
  verre: 'verres',
  bol: 'bols',
  pincée: 'pincées',
  pointe: 'pointes',
  tablette: 'tablettes',
};

export const uniteAccordee = (unite: string, q: number): string =>
  q >= 2 ? (PLURIELS_UNITES[unite] ?? unite) : unite;

const MOTS_INVARIABLES = new Set(['de', "d'", 'd’', 'à', 'au', 'aux', 'la', 'le', 'les', 'en', 'et', 'du']);

/** « poivron rouge » donne « poivrons rouges » ; les mots déjà au pluriel restent tels quels. */
export function nomAuPluriel(nom: string): string {
  return nom
    .split(' ')
    .map((mot) =>
      MOTS_INVARIABLES.has(mot.toLowerCase()) || /[sxz]$/i.test(mot) || mot.length < 2
        ? mot
        : mot.endsWith('eau')
          ? `${mot}x`
          : `${mot}s`,
    )
    .join(' ');
}

const commenceParVoyelle = (s: string) => /^[aeiouyhâàéèêëîïôœûù]/i.test(s);
export const liaison = (nom: string): string => (commenceParVoyelle(nom) ? 'd’' : 'de ');

/** Texte d’un ingrédient pour une quantité donnée : « 2 gousses d’ail », « 750 g de bœuf haché », « 3 oignons ». */
export function texteQuantite(quantite: number, unite: string | null, nom: string): string {
  const q = formaterQuantite(quantite);
  if (unite) {
    const avecEspace =
      MASSES_VOLUMES.has(unite) || unite.startsWith('c.') ? unite : uniteAccordee(unite, quantite);
    return `${q} ${avecEspace} ${liaison(nom)}${nom}`;
  }
  return `${q} ${quantite >= 2 ? nomAuPluriel(nom) : nom}`;
}

/** Ingrédient pour un nombre de portions différent de celui de la recette. */
export function texteMisALEchelle(ingredient: Ingredient, facteur: number): string {
  if (Math.abs(facteur - 1) < 1e-9 || ingredient.quantite === null || ingredient.recetteId)
    return ingredient.texte;
  const q = arrondirQuantite(ingredient.quantite * facteur, ingredient.unite, ingredient.nom);
  let texte = texteQuantite(q, ingredient.unite, ingredient.nom);
  if (ingredient.precision) texte += ` (${ingredient.precision})`;
  if (ingredient.facultatif) texte += ' (facultatif)';
  return texte;
}
