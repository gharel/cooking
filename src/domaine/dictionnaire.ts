import { normaliser } from './texte';

export type Rayon =
  | 'fruits-legumes'
  | 'boucherie'
  | 'poissonnerie'
  | 'cremerie'
  | 'boulangerie'
  | 'epicerie'
  | 'surgeles'
  | 'autre';

export const RAYONS: Readonly<Record<Rayon, string>> = {
  'fruits-legumes': 'Fruits et légumes',
  boucherie: 'Boucherie et charcuterie',
  poissonnerie: 'Poissonnerie',
  cremerie: 'Crèmerie et œufs',
  boulangerie: 'Boulangerie',
  epicerie: 'Épicerie',
  surgeles: 'Surgelés',
  autre: 'Autre',
};

interface Entree {
  cle: string;
  rayon: Rayon;
  /** Formes normalisées (sans accents, minuscules) ; la plus longue qui correspond l’emporte. */
  motifs: string[];
  /** Viande ou poisson crus : planche et mains à laver après (hygiène de la session). */
  cru?: true;
}

const ENTREES: Entree[] = [
  // Fruits et légumes
  {
    cle: 'oignon-nouveau',
    rayon: 'fruits-legumes',
    motifs: ['oignons nouveaux', 'oignon nouveau', 'cebettes', 'cebette'],
  },
  { cle: 'oignon', rayon: 'fruits-legumes', motifs: ['oignons', 'oignon'] },
  { cle: 'echalote', rayon: 'fruits-legumes', motifs: ['echalotes', 'echalote'] },
  { cle: 'ail', rayon: 'fruits-legumes', motifs: ['ail'] },
  { cle: 'gingembre', rayon: 'fruits-legumes', motifs: ['gingembre'] },
  { cle: 'tomate', rayon: 'fruits-legumes', motifs: ['tomates', 'tomate'] },
  { cle: 'aubergine', rayon: 'fruits-legumes', motifs: ['aubergines', 'aubergine'] },
  { cle: 'courgette', rayon: 'fruits-legumes', motifs: ['courgettes', 'courgette'] },
  { cle: 'poivron', rayon: 'fruits-legumes', motifs: ['poivrons', 'poivron'] },
  { cle: 'carotte', rayon: 'fruits-legumes', motifs: ['carottes', 'carotte'] },
  { cle: 'celeri', rayon: 'fruits-legumes', motifs: ['celeri'] },
  { cle: 'pomme-de-terre', rayon: 'fruits-legumes', motifs: ['pommes de terre', 'pomme de terre'] },
  { cle: 'patate-douce', rayon: 'fruits-legumes', motifs: ['patates douces', 'patate douce'] },
  { cle: 'pomme', rayon: 'fruits-legumes', motifs: ['pommes', 'pomme'] },
  { cle: 'citron-vert', rayon: 'fruits-legumes', motifs: ['citrons verts', 'citron vert'] },
  { cle: 'citron', rayon: 'fruits-legumes', motifs: ['citrons', 'citron'] },
  { cle: 'coriandre', rayon: 'fruits-legumes', motifs: ['coriandre'] },
  { cle: 'persil', rayon: 'fruits-legumes', motifs: ['persil'] },
  { cle: 'basilic', rayon: 'fruits-legumes', motifs: ['basilic'] },
  { cle: 'menthe', rayon: 'fruits-legumes', motifs: ['menthe'] },
  { cle: 'concombre', rayon: 'fruits-legumes', motifs: ['concombres', 'concombre'] },
  { cle: 'salade', rayon: 'fruits-legumes', motifs: ['salade verte', 'laitue', 'salade'] },
  { cle: 'avocat', rayon: 'fruits-legumes', motifs: ['avocats', 'avocat'] },
  { cle: 'champignon', rayon: 'fruits-legumes', motifs: ['champignons', 'champignon'] },
  { cle: 'epinard', rayon: 'fruits-legumes', motifs: ['epinards', 'epinard'] },
  { cle: 'poireau', rayon: 'fruits-legumes', motifs: ['poireaux', 'poireau'] },
  // Boucherie, charcuterie, poissonnerie
  {
    cle: 'boeuf-hache',
    rayon: 'boucherie',
    motifs: ['boeuf hache', 'viande hachee', 'steak hache', 'steaks haches'],
    cru: true,
  },
  { cle: 'chair-a-saucisse', rayon: 'boucherie', motifs: ['chair a saucisse'], cru: true },
  { cle: 'lardons', rayon: 'boucherie', motifs: ['lardons', 'lardon'] },
  { cle: 'jambon', rayon: 'boucherie', motifs: ['jambon'] },
  { cle: 'poulet', rayon: 'boucherie', motifs: ['blancs de poulet', 'blanc de poulet', 'poulet'], cru: true },
  { cle: 'saumon', rayon: 'poissonnerie', motifs: ['saumon'], cru: true },
  { cle: 'morue', rayon: 'poissonnerie', motifs: ['morue'] },
  // Crèmerie et œufs
  { cle: 'oeuf', rayon: 'cremerie', motifs: ['oeufs', 'oeuf'] },
  { cle: 'creme-fraiche', rayon: 'cremerie', motifs: ['creme fraiche'] },
  { cle: 'creme-liquide', rayon: 'cremerie', motifs: ['creme liquide', 'creme'] },
  { cle: 'lait', rayon: 'cremerie', motifs: ['lait'] },
  { cle: 'beurre', rayon: 'cremerie', motifs: ['beurre'] },
  { cle: 'gruyere', rayon: 'cremerie', motifs: ['gruyere', 'emmental'] },
  { cle: 'parmesan', rayon: 'cremerie', motifs: ['parmesan'] },
  { cle: 'feta', rayon: 'cremerie', motifs: ['feta'] },
  { cle: 'camembert', rayon: 'cremerie', motifs: ['camembert'] },
  { cle: 'fromage', rayon: 'cremerie', motifs: ['fromage rape', 'fromage'] },
  { cle: 'pate-brisee', rayon: 'cremerie', motifs: ['pate brisee', 'pate feuilletee'] },
  // Boulangerie
  { cle: 'baguette', rayon: 'boulangerie', motifs: ['baguettes', 'baguette'] },
  { cle: 'pain-de-mie', rayon: 'boulangerie', motifs: ['pain de mie'] },
  // Épicerie
  { cle: 'lentilles-corail', rayon: 'epicerie', motifs: ['lentilles corail', 'lentille corail'] },
  { cle: 'lentilles', rayon: 'epicerie', motifs: ['lentilles', 'lentille'] },
  {
    cle: 'tomates-concassees',
    rayon: 'epicerie',
    motifs: ['tomates concassees', 'tomates pelees', 'coulis de tomate'],
  },
  { cle: 'concentre-tomate', rayon: 'epicerie', motifs: ['concentre de tomate', 'concentre de tomates'] },
  { cle: 'lait-de-coco', rayon: 'epicerie', motifs: ['lait de coco'] },
  { cle: 'bouillon', rayon: 'epicerie', motifs: ['bouillon'] },
  { cle: 'haricots-rouges', rayon: 'epicerie', motifs: ['haricots rouges'] },
  { cle: 'riz', rayon: 'epicerie', motifs: ['riz'] },
  {
    cle: 'feuilles-lasagne',
    rayon: 'epicerie',
    motifs: ['feuilles de lasagne', 'feuilles de lasagnes', 'lasagne', 'lasagnes'],
  },
  { cle: 'pates', rayon: 'epicerie', motifs: ['pates', 'spaghetti', 'spaghettis', 'penne'] },
  { cle: 'farine', rayon: 'epicerie', motifs: ['farine'] },
  { cle: 'sucre', rayon: 'epicerie', motifs: ['sucre'] },
  { cle: 'chocolat', rayon: 'epicerie', motifs: ['chocolat'] },
  { cle: 'chapelure', rayon: 'epicerie', motifs: ['chapelure'] },
  { cle: 'sauce-soja', rayon: 'epicerie', motifs: ['sauce soja'] },
  { cle: 'thon', rayon: 'epicerie', motifs: ['thon'] },
  { cle: 'mais', rayon: 'epicerie', motifs: ['mais doux'] },
  { cle: 'cornichon', rayon: 'epicerie', motifs: ['cornichons', 'cornichon'] },
  { cle: 'tortilla', rayon: 'epicerie', motifs: ['galettes de ble', 'tortillas', 'tortilla'] },
  { cle: 'vinaigre', rayon: 'epicerie', motifs: ['vinaigre'] },
  { cle: 'moutarde', rayon: 'epicerie', motifs: ['moutarde'] },
  {
    cle: 'epices-fajitas',
    rayon: 'epicerie',
    motifs: ['epices a fajitas', 'epices fajitas', 'melange fajitas'],
  },
  { cle: 'huile-olive', rayon: 'epicerie', motifs: ["huile d'olive"] },
  { cle: 'huile', rayon: 'epicerie', motifs: ['huile'] },
  { cle: 'vin-rouge', rayon: 'epicerie', motifs: ['vin rouge'] },
  { cle: 'vin-blanc', rayon: 'epicerie', motifs: ['vin blanc'] },
  { cle: 'calvados', rayon: 'epicerie', motifs: ['calvados'] },
  { cle: 'curry', rayon: 'epicerie', motifs: ['curry'] },
  { cle: 'curcuma', rayon: 'epicerie', motifs: ['curcuma'] },
  { cle: 'cumin', rayon: 'epicerie', motifs: ['cumin'] },
  { cle: 'paprika', rayon: 'epicerie', motifs: ['paprika'] },
  { cle: 'piment', rayon: 'epicerie', motifs: ['piment'] },
  { cle: 'herbes-de-provence', rayon: 'epicerie', motifs: ['herbes de provence'] },
  { cle: 'origan', rayon: 'epicerie', motifs: ['origan'] },
  { cle: 'thym', rayon: 'epicerie', motifs: ['thym'] },
  { cle: 'laurier', rayon: 'epicerie', motifs: ['laurier'] },
  { cle: 'muscade', rayon: 'epicerie', motifs: ['muscade'] },
  { cle: 'sel', rayon: 'epicerie', motifs: ['sel'] },
  { cle: 'poivre', rayon: 'epicerie', motifs: ['poivre'] },
  // Surgelés
  { cle: 'petits-pois', rayon: 'surgeles', motifs: ['petits pois'] },
];

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Toutes les formes, de la plus longue à la plus courte, avec leur expression en mots entiers. */
const FORMES = ENTREES.flatMap((e) =>
  e.motifs.map((motif) => ({
    entree: e,
    motif,
    expression: new RegExp(`(^|[^a-z0-9])(${echapper(motif)})(?=[^a-z0-9]|$)`, 'g'),
  })),
).sort((a, b) => b.motif.length - a.motif.length);

const CRUS = new Set(ENTREES.filter((e) => e.cru).map((e) => e.cle));
/** Viandes et poissons crus (poulet, bœuf haché, chair à saucisse, saumon). */
export const estCru = (cle: string): boolean => CRUS.has(cle);

export interface Reconnu {
  cle: string;
  rayon: Rayon;
}

/** Reconnaît un nom d’ingrédient (« bœuf haché », « tomates concassées ») : clé et rayon. */
export function reconnaitre(nom: string): Reconnu | null {
  const n = normaliser(nom);
  for (const forme of FORMES) {
    forme.expression.lastIndex = 0;
    if (forme.expression.test(n)) return { cle: forme.entree.cle, rayon: forme.entree.rayon };
  }
  return null;
}

export interface Occurrence extends Reconnu {
  debut: number;
  fin: number;
}

/** Repère les ingrédients connus dans un texte normalisé, sans chevauchement, la forme la plus longue d’abord. */
export function reperer(texteNormalise: string): Occurrence[] {
  const pris: boolean[] = [];
  const trouves: Occurrence[] = [];
  for (const forme of FORMES) {
    forme.expression.lastIndex = 0;
    for (const m of texteNormalise.matchAll(forme.expression)) {
      const debut = (m.index ?? 0) + (m[1]?.length ?? 0);
      const fin = debut + forme.motif.length;
      let libre = true;
      for (let i = debut; i < fin; i++) if (pris[i]) libre = false;
      if (!libre) continue;
      for (let i = debut; i < fin; i++) pris[i] = true;
      trouves.push({ cle: forme.entree.cle, rayon: forme.entree.rayon, debut, fin });
    }
  }
  return trouves.sort((a, b) => a.debut - b.debut);
}
