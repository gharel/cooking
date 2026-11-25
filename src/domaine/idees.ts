import { analyserIngredient } from './ingredients';
import { structurer } from './structuration';
import type { Recette } from './modele';
import type { Reste } from './stock';

/** Idée anti-gaspi du catalogue : une recette courte, racontée, à ajouter à la bibliothèque d’un geste. */
export interface IdeeCatalogue {
  id: string;
  nom: string;
  duree: number;
  vegetarien: boolean;
  ingredients: string[];
  texte: string;
}

export const CATALOGUE: readonly IdeeCatalogue[] = [
  {
    id: 'idee-frittata',
    nom: 'Frittata aux légumes',
    duree: 25,
    vegetarien: true,
    ingredients: ['6 œufs', '1 courgette', '1 poivron', '1 oignon', '100 g de feta', '10 cl de lait'],
    texte:
      'Couper la courgette et le poivron en dés, émincer l’oignon. Faire revenir les légumes 8 min. Battre les œufs avec le lait. Verser les œufs sur les légumes, ajouter la feta émiettée et cuire 10 min à feu doux.',
  },
  {
    id: 'idee-riz-saute',
    nom: 'Riz sauté aux légumes et à l’œuf',
    duree: 20,
    vegetarien: true,
    ingredients: [
      '300 g de riz cuit',
      '3 œufs',
      '1 poivron',
      '1 courgette',
      '1 oignon',
      '2 c. à s. de sauce soja',
    ],
    texte:
      'Couper le poivron et la courgette en dés, émincer l’oignon. Faire revenir les légumes 6 min. Ajouter le riz cuit et les œufs battus, faire sauter 6 min avec la sauce soja.',
  },
  {
    id: 'idee-shakshuka',
    nom: 'Shakshuka',
    duree: 30,
    vegetarien: true,
    ingredients: [
      '4 œufs',
      '1 boîte de tomates concassées (400 g)',
      '1 poivron',
      '1 oignon',
      '100 g de feta',
      '1 c. à c. de cumin',
    ],
    texte:
      'Émincer l’oignon et couper le poivron. Faire revenir 6 min avec le cumin. Ajouter les tomates et laisser mijoter 10 min. Casser les œufs dans la sauce, ajouter la feta et cuire 8 min à couvert.',
  },
  {
    id: 'idee-gratin-riz',
    nom: 'Gratin de riz express',
    duree: 30,
    vegetarien: true,
    ingredients: [
      '300 g de riz cuit',
      '20 cl de crème liquide',
      '80 g de gruyère râpé',
      '2 tomates',
      '10 cl de lait',
    ],
    texte:
      'Préchauffer le four à 200 °C. Couper les tomates en rondelles. Mélanger le riz avec la crème et le lait, verser dans un plat, couvrir de tomates et de gruyère. Gratiner 15 min.',
  },
  {
    id: 'idee-soupe',
    nom: 'Soupe de légumes du frigo',
    duree: 35,
    vegetarien: true,
    ingredients: ['2 carottes', '1 courgette', '2 pommes de terre', '1 oignon', '1 l de bouillon de légumes'],
    texte:
      'Éplucher et couper les légumes, émincer l’oignon. Faire revenir l’oignon 5 min. Ajouter les légumes et le bouillon, laisser mijoter 20 min. Mixer.',
  },
  {
    id: 'idee-salade-grecque',
    nom: 'Salade grecque',
    duree: 15,
    vegetarien: true,
    ingredients: [
      '3 tomates',
      '1 concombre',
      '1 poivron',
      '1 oignon',
      '150 g de feta',
      '2 c. à s. d’huile d’olive',
    ],
    texte:
      'Couper les tomates, le concombre et le poivron, émincer l’oignon. Mélanger avec la feta et l’huile d’olive.',
  },
  {
    id: 'idee-pates-jambon',
    nom: 'Pâtes crème, jambon et champignons',
    duree: 20,
    vegetarien: false,
    ingredients: [
      '300 g de pâtes',
      '20 cl de crème liquide',
      '150 g de jambon',
      '200 g de champignons',
      '50 g de parmesan',
    ],
    texte:
      'Cuire les pâtes 10 min. Pendant ce temps, couper le jambon et émincer les champignons, les faire revenir 6 min. Ajouter la crème, mélanger avec les pâtes et le parmesan.',
  },
];

export interface Idee {
  source: 'recette' | 'catalogue';
  id: string;
  nom: string;
  duree: number | null;
  /** Clés des ingrédients restants utilisés. */
  utilises: string[];
  /** Ingrédients restants « à finir vite » sauvés. */
  sauves: string[];
  /** Ce qui manque, en clair (« 3 œufs de plus », « 1 concombre »). */
  manque: string[];
  score: number;
}

interface Besoin {
  cle: string;
  texte: string;
  quantite: number | null;
  unite: string | null;
}

const besoinsDe = (
  lignes: readonly {
    cle: string;
    texte: string;
    quantite: number | null;
    unite: string | null;
    facultatif?: boolean;
  }[],
  placard: ReadonlySet<string>,
): Besoin[] =>
  lignes.filter((l) => !placard.has(l.cle) && !l.facultatif && l.cle !== 'sel' && l.cle !== 'poivre');

/** Évalue une liste d’ingrédients face au frigo : utilisés, sauvés, manquants (quantités comprises si connues). */
function evaluer(besoins: Besoin[], restes: readonly Reste[]) {
  const utilises: string[] = [];
  const sauves: string[] = [];
  const manque: string[] = [];
  for (const b of besoins) {
    const r = restes.find((x) => x.cle === b.cle);
    if (!r) {
      manque.push(b.texte);
      continue;
    }
    utilises.push(b.cle);
    if (r.vite) sauves.push(b.cle);
    const memeUnite = (r.unite ?? null) === (b.unite ?? null);
    // Il en manque vraiment s’il reste moins des trois quarts (½ oignon pour 1 : on s’adapte ; 3 œufs pour 6 : non).
    const piecesUnitaires = !b.unite && (b.quantite ?? 0) <= 1;
    if (
      memeUnite &&
      !piecesUnitaires &&
      r.quantite !== null &&
      b.quantite !== null &&
      r.quantite < b.quantite * 0.75
    ) {
      const ecart = Math.round((b.quantite - r.quantite) * 10) / 10;
      manque.push(`${String(ecart).replace('.', ',')}${b.unite ? ` ${b.unite}` : ''} de plus (${r.nom})`);
    }
  }
  return { utilises, sauves, manque, score: utilises.length + 2 * sauves.length - 1.5 * manque.length };
}

/**
 * Idées pour finir le frigo : recettes de la bibliothèque et catalogue anti-gaspi, classées par ingrédients
 * utilisés, ingrédients « à finir vite » sauvés et ingrédients manquants. Basiques du placard supposés présents.
 */
export function idees(
  restes: readonly Reste[],
  recettes: readonly Recette[],
  placard: readonly string[],
): Idee[] {
  const auPlacard = new Set(placard);
  const depuisRecettes = recettes.map((r) => ({
    source: 'recette' as const,
    id: r.id,
    nom: r.nom,
    duree: null,
    ...evaluer(
      besoinsDe(
        r.ingredients.filter((i) => !i.recetteId),
        auPlacard,
      ),
      restes,
    ),
  }));
  const nomsBibliotheque = new Set(recettes.map((r) => r.nom.toLowerCase()));
  const depuisCatalogue = CATALOGUE.filter((c) => !nomsBibliotheque.has(c.nom.toLowerCase())).map((c) => ({
    source: 'catalogue' as const,
    id: c.id,
    nom: c.nom,
    duree: c.duree,
    ...evaluer(
      besoinsDe(
        c.ingredients.map((l) => analyserIngredient(l)),
        auPlacard,
      ),
      restes,
    ),
  }));
  return [...depuisRecettes, ...depuisCatalogue]
    .filter((i) => i.utilises.length >= 2 && i.manque.length <= 3)
    .sort(
      (a, b) => b.score - a.score || a.manque.length - b.manque.length || a.nom.localeCompare(b.nom, 'fr'),
    );
}

/** La paire d’idées sans achat qui finit le plus d’ingrédients « à finir vite », puis le plus d’ingrédients. */
export function miniSession(liste: readonly Idee[]): [Idee, Idee] | null {
  const sansAchat = liste.filter((i) => i.manque.length === 0);
  let meilleure: { paire: [Idee, Idee]; v: number; u: number } | null = null;
  for (let a = 0; a < sansAchat.length; a++)
    for (let b = a + 1; b < sansAchat.length; b++) {
      const x = sansAchat[a];
      const y = sansAchat[b];
      if (!x || !y) continue;
      const v = new Set([...x.sauves, ...y.sauves]).size;
      const u = new Set([...x.utilises, ...y.utilises]).size;
      if (!meilleure || v > meilleure.v || (v === meilleure.v && u > meilleure.u))
        meilleure = { paire: [x, y], v, u };
    }
  return meilleure && meilleure.v >= 1 ? meilleure.paire : null;
}

/** Recette de la bibliothèque tirée d’une idée du catalogue : étapes proposées à partir de son texte. */
export function recetteDepuisIdee(idee: IdeeCatalogue, id: string, maintenant: string): Recette {
  return {
    id,
    nom: idee.nom,
    sousTitre: 'Idée anti-gaspi',
    note: 'Adaptez aux restes du frigo : les quantités sont indicatives.',
    portions: 4,
    vegetarien: idee.vegetarien,
    soir: true,
    ingredients: idee.ingredients.map((l) => analyserIngredient(l)),
    etapes: structurer(idee.texte).etapes,
    conservation: { frigoJours: 2, congelateurMois: null },
    origine: { type: 'depart', de: null, mot: null, source: null },
    texteOriginal: idee.texte,
    photos: [],
    creeLe: maintenant,
    modifieLe: maintenant,
  };
}
