import { reconnaitre } from './dictionnaire';
import type { Ingredient } from './modele';
import { normaliser, slug } from './texte';

/** Unité affichée et formes reconnues (normalisées). */
const UNITES: [string, string[]][] = [
  ['c. à s.', ['c. a s.', 'c.a.s.', 'c.a.s', 'cas', 'cuilleres a soupe', 'cuillere a soupe', 'c. a soupe']],
  ['c. à c.', ['c. a c.', 'c.a.c.', 'c.a.c', 'cac', 'cuilleres a cafe', 'cuillere a cafe', 'c. a cafe']],
  ['kg', ['kg', 'kilos', 'kilo']],
  ['g', ['grammes', 'gramme', 'gr', 'g']],
  ['l', ['litres', 'litre', 'l']],
  ['dl', ['dl']],
  ['cl', ['cl']],
  ['ml', ['ml']],
  ['cm', ['cm']],
  ['pincée', ['pincees', 'pincee']],
  ['pointe', ['pointes', 'pointe']],
  ['gousse', ['gousses', 'gousse']],
  ['botte', ['bottes', 'botte']],
  ['boîte', ['boites', 'boite']],
  ['branche', ['branches', 'branche']],
  ['feuille', ['feuilles', 'feuille']],
  ['tranche', ['tranches', 'tranche']],
  ['carré', ['carres', 'carre']],
  ['morceau', ['morceaux', 'morceau']],
  ['sachet', ['sachets', 'sachet']],
  ['tête', ['tetes', 'tete']],
  ['brin', ['brins', 'brin']],
  ['poignée', ['poignees', 'poignee']],
  ['verre', ['verres', 'verre']],
  ['bol', ['bols', 'bol']],
];

const FORMES_UNITES = UNITES.flatMap(([affichee, formes]) =>
  formes.map((f) => ({ affichee, forme: f })),
).sort((a, b) => b.forme.length - a.forme.length);

const FRACTIONS: Readonly<Record<string, number>> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3 };
const QUANTITE = /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?\s*[½¼¾⅓]?|[½¼¾⅓])\s*/;

/** Unité affichée pour une forme normalisée (« gousses » donne « gousse »), ou null. */
export function uniteAffichee(forme: string): string | null {
  return FORMES_UNITES.find((u) => u.forme === forme)?.affichee ?? null;
}

/** Formes d’unités, de la plus longue à la plus courte, pour construire d’autres expressions. */
export const FORMES_D_UNITES: readonly string[] = FORMES_UNITES.map((u) => u.forme);

export function lireQuantite(texte: string): number | null {
  const t = texte.trim();
  const fraction = FRACTIONS[t];
  if (fraction !== undefined) return fraction;
  const divise = /^(\d+)\s*\/\s*(\d+)$/.exec(t);
  if (divise) return Number(divise[1]) / Number(divise[2]);
  const avecFraction = /^(\d+)\s*([½¼¾⅓])$/.exec(t);
  if (avecFraction) return Number(avecFraction[1]) + (FRACTIONS[avecFraction[2] ?? ''] ?? 0);
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * Analyse une ligne d’ingrédient : « 500 g de bœuf haché », « 2 gousses d’ail »,
 * « 1 boîte de tomates concassées (400 g) », « 10 cl de vin rouge (facultatif) », « sel, poivre ».
 */
export function analyserIngredient(ligne: string): Ingredient {
  const texte = ligne.trim();
  let reste = texte;
  let facultatif = false;
  let precision: string | null = null;

  const parenthese = /\s*\(([^)]*)\)\s*$/.exec(reste);
  if (parenthese) {
    const contenu = (parenthese[1] ?? '').trim();
    if (/^facultati(f|ve)/i.test(contenu)) facultatif = true;
    else precision = contenu;
    reste = reste.slice(0, parenthese.index).trim();
  }

  let quantite: number | null = null;
  const q = QUANTITE.exec(reste);
  if (q) {
    quantite = lireQuantite(q[1] ?? '');
    reste = reste.slice(q[0].length);
  }

  let unite: string | null = null;
  if (quantite !== null) {
    const n = normaliser(reste);
    const u = FORMES_UNITES.find(
      ({ forme }) => n.startsWith(forme) && /^[\s.]|^$/.test(n.slice(forme.length)),
    );
    if (u) {
      unite = u.affichee;
      reste = reste.slice(u.forme.length).trim();
    }
  }

  const nom = reste.replace(/^(de |d[’'])/i, '').trim();
  const reconnu = reconnaitre(nom);
  return {
    texte,
    quantite,
    unite,
    nom,
    precision,
    facultatif,
    cle: reconnu?.cle ?? slug(nom),
    rayon: reconnu?.rayon ?? 'autre',
    recetteId: null,
  };
}
