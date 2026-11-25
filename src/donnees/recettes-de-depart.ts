import { analyserIngredient } from '../domaine/ingredients';
import type { Etape, Ingredient, Poste, Recette } from '../domaine/modele';

/**
 * Les 13 recettes de départ de la maison, pour 4 portions (le nombre de portions se choisit au moment
 * de préparer la session). Source unique : l’annexe docs/specs/002-recettes-de-depart.md en est générée
 * (`npm run annexe`).
 */

interface EtapeDeDepart {
  texte: string;
  poste: Poste;
  actif: boolean;
  duree: number;
  apres?: number[];
  facultative?: boolean;
  veille?: boolean;
  sousRecette?: string;
}

export interface RecetteDeDepart {
  id: string;
  nom: string;
  precision?: string;
  vegetarien: boolean;
  frigoJours: number;
  congelateurMois: number | null;
  note?: string;
  ingredients: (string | { sousRecette: string; texte: string })[];
  etapes: EtapeDeDepart[];
}

const plan = (texte: string, duree: number, apres?: number[]): EtapeDeDepart => ({
  texte,
  poste: 'plan',
  actif: true,
  duree,
  ...(apres ? { apres } : {}),
});
const feu = (texte: string, actif: boolean, duree: number, apres?: number[]): EtapeDeDepart => ({
  texte,
  poste: 'feu',
  actif,
  duree,
  ...(apres ? { apres } : {}),
});
const four = (texte: string, duree: number, apres?: number[]): EtapeDeDepart => ({
  texte,
  poste: 'four',
  actif: false,
  duree,
  ...(apres ? { apres } : {}),
});
const refroidir = (
  apres: number,
  duree = 30,
  texte = 'Laisser refroidir avant de portionner',
): EtapeDeDepart => ({
  texte,
  poste: 'repos',
  actif: false,
  duree,
  apres: [apres],
});

export const RECETTES_DE_DEPART: readonly RecetteDeDepart[] = [
  {
    id: 'depart-dahl',
    nom: 'Dahl de lentilles',
    vegetarien: true,
    frigoJours: 3,
    congelateurMois: 3,
    note: 'Coriandre fraîche à ajouter au moment de servir si le dahl a été congelé.',
    ingredients: [
      '250 g de lentilles corail',
      '1 oignon',
      '2 gousses d’ail',
      '3 cm de gingembre frais',
      '1 boîte de tomates concassées (400 g)',
      '40 cl de lait de coco',
      '50 cl de bouillon de légumes',
      '2 c. à c. de curry',
      '1 c. à c. de curcuma',
      '1 c. à c. de cumin',
      '2 c. à s. d’huile',
      '1 citron vert',
      '½ botte de coriandre',
    ],
    etapes: [
      plan('Émincer l’oignon, l’ail et le gingembre', 6),
      plan('Rincer les lentilles', 2),
      feu('Faire revenir oignon, ail, gingembre et épices dans l’huile', true, 5, [1]),
      feu(
        'Ajouter lentilles, tomates, lait de coco et bouillon ; mijoter en remuant de temps en temps',
        false,
        25,
        [2, 3],
      ),
      plan('Ajouter le jus du citron et la coriandre', 2, [4]),
      refroidir(5),
    ],
  },
  {
    id: 'depart-ratatouille',
    nom: 'Ratatouille',
    vegetarien: true,
    frigoJours: 3,
    congelateurMois: 3,
    ingredients: [
      '1 grosse aubergine',
      '2 courgettes',
      '2 poivrons (1 rouge, 1 jaune)',
      '1 gros oignon',
      '2 gousses d’ail',
      '1 boîte de tomates concassées (400 g)',
      '1 c. à s. d’herbes de Provence',
      '3 c. à s. d’huile d’olive',
      'sel',
      'poivre',
    ],
    etapes: [
      plan('Couper l’aubergine, les courgettes et les poivrons en dés', 12),
      plan('Émincer l’oignon et l’ail', 5),
      feu('Faire revenir l’oignon dans l’huile', true, 5, [2]),
      feu('Ajouter l’aubergine et les poivrons, faire dorer', true, 10, [1, 3]),
      feu('Ajouter les courgettes, les tomates, l’ail et les herbes ; mijoter à couvert', false, 40, [4]),
      refroidir(5),
    ],
  },
  {
    id: 'depart-bolognaise',
    nom: 'Bolognaise',
    vegetarien: false,
    frigoJours: 3,
    congelateurMois: 3,
    note: 'Sert aussi de sauce à la lasagne.',
    ingredients: [
      '500 g de bœuf haché',
      '1 oignon',
      '1 carotte',
      '1 branche de céleri',
      '2 gousses d’ail',
      '1 boîte de tomates concassées (800 g)',
      '2 c. à s. de concentré de tomate',
      '10 cl de vin rouge (facultatif)',
      '1 feuille de laurier',
      '1 c. à c. de thym',
      '2 c. à s. d’huile d’olive',
      'sel',
      'poivre',
    ],
    etapes: [
      plan('Hacher finement l’oignon, la carotte, le céleri et l’ail', 10),
      feu('Faire revenir les légumes hachés dans l’huile', true, 6, [1]),
      feu('Ajouter le bœuf et le faire dorer', true, 8, [2]),
      feu('Ajouter le concentré, le vin, les tomates et les herbes ; mijoter à couvert', false, 45, [3]),
      refroidir(4),
    ],
  },
  {
    id: 'depart-chili',
    nom: 'Chili con carne',
    vegetarien: false,
    frigoJours: 3,
    congelateurMois: 3,
    ingredients: [
      '500 g de bœuf haché',
      '1 oignon',
      '2 gousses d’ail',
      '1 poivron rouge',
      '1 boîte de tomates concassées (400 g)',
      '1 c. à s. de concentré de tomate',
      '1 boîte de haricots rouges (400 g)',
      '1 c. à c. de cumin',
      '1 c. à c. de paprika',
      '½ c. à c. de piment en poudre (selon le goût)',
      '1 carré de chocolat noir (facultatif)',
      '2 c. à s. d’huile',
      'sel',
    ],
    etapes: [
      plan('Émincer l’oignon et l’ail, couper le poivron', 8),
      feu('Faire revenir l’oignon, l’ail et le poivron dans l’huile', true, 6, [1]),
      feu('Ajouter le bœuf et les épices, faire dorer', true, 8, [2]),
      feu('Ajouter les tomates et le concentré ; mijoter à couvert', false, 25, [3]),
      plan('Rincer et égoutter les haricots', 2),
      feu('Ajouter les haricots et le chocolat ; mijoter encore', false, 15, [4, 5]),
      refroidir(6),
    ],
  },
  {
    id: 'depart-riz-cantonais',
    nom: 'Riz cantonais',
    vegetarien: false,
    frigoJours: 2,
    congelateurMois: 1,
    note: 'Le riz cuit doit refroidir vite et se garde peu : 2 jours au frigo au plus.',
    ingredients: [
      '300 g de riz long',
      '3 œufs',
      '150 g de jambon blanc',
      '150 g de petits pois surgelés',
      '2 oignons nouveaux',
      '3 c. à s. de sauce soja',
      '2 c. à s. d’huile',
    ],
    etapes: [
      plan('Rincer le riz', 2),
      feu('Cuire le riz', false, 12, [1]),
      {
        texte: 'Étaler le riz et le laisser refroidir (idéalement cuit la veille)',
        poste: 'repos',
        actif: false,
        duree: 30,
        apres: [2],
      },
      plan('Couper le jambon en dés et émincer les oignons nouveaux', 5),
      feu('Cuire les œufs battus en omelette fine, puis la couper en lanières', true, 5),
      feu(
        'Faire sauter le riz avec les petits pois, le jambon, l’omelette et la sauce soja',
        true,
        8,
        [3, 4, 5],
      ),
      refroidir(6, 20, 'Refroidir rapidement avant de portionner'),
    ],
  },
  {
    id: 'depart-gratin-dauphinois',
    nom: 'Gratin dauphinois',
    precision: 'Pommes de terre et patates douces',
    vegetarien: true,
    frigoJours: 3,
    congelateurMois: 2,
    note: 'Se congèle bien ; la texture devient un peu plus fondante.',
    ingredients: [
      '500 g de pommes de terre',
      '500 g de patates douces',
      '25 cl de crème liquide',
      '25 cl de lait',
      '1 gousse d’ail',
      '½ c. à c. de muscade',
      '80 g de gruyère râpé',
      '15 g de beurre',
      'sel',
      'poivre',
    ],
    etapes: [
      four('Préchauffer le four à 180 °C', 15),
      plan('Éplucher les pommes de terre et les patates douces, les couper en fines rondelles', 15),
      feu('Chauffer le lait et la crème avec l’ail écrasé, la muscade, du sel et du poivre', true, 5),
      plan('Beurrer le plat, alterner les rondelles, verser le mélange, parsemer de gruyère', 7, [2, 3]),
      four('Cuire au four jusqu’à ce que la pointe d’un couteau s’enfonce sans résistance', 55, [1, 4]),
      refroidir(5),
    ],
  },
  {
    id: 'depart-tian-corse',
    nom: 'Tian de légumes corse',
    precision: 'En couches comme une lasagne',
    vegetarien: false,
    frigoJours: 3,
    congelateurMois: 3,
    ingredients: [
      '300 g de chair à saucisse',
      '6 feuilles de lasagne',
      '2 courgettes',
      '3 tomates',
      '1 oignon',
      '1 gousse d’ail',
      '½ botte de basilic',
      '½ c. à c. de muscade',
      '80 g de gruyère râpé',
      '2 c. à s. d’huile d’olive',
      'sel',
      'poivre',
    ],
    etapes: [
      four('Préchauffer le four à 180 °C', 15),
      plan('Couper les courgettes et les tomates en fines rondelles, ciseler le basilic', 12),
      plan('Émincer l’oignon et l’ail', 4),
      feu('Faire revenir la chair à saucisse avec l’oignon et l’ail, ajouter la muscade', true, 10, [3]),
      plan(
        'Monter en couches : feuilles de lasagne, chair à saucisse, courgettes, tomates, basilic ; finir par le gruyère',
        10,
        [2, 4],
      ),
      four('Cuire au four, couvert les 20 premières minutes', 45, [1, 5]),
      refroidir(6),
    ],
  },
  {
    id: 'depart-lasagne',
    nom: 'Lasagne',
    vegetarien: false,
    frigoJours: 3,
    congelateurMois: 3,
    ingredients: [
      { sousRecette: 'depart-bolognaise', texte: 'Bolognaise : 4 portions (voir la recette)' },
      '9 feuilles de lasagne',
      '40 g de beurre',
      '40 g de farine',
      '50 cl de lait',
      '½ c. à c. de muscade',
      '80 g de parmesan',
      'sel',
      'poivre',
    ],
    etapes: [
      {
        texte: 'Préparer la bolognaise, ou en prendre une déjà prête',
        poste: 'feu',
        actif: true,
        duree: 69,
        sousRecette: 'depart-bolognaise',
      },
      four('Préchauffer le four à 180 °C', 15),
      feu(
        'Béchamel : fondre le beurre, ajouter la farine, puis le lait en fouettant, et la muscade',
        true,
        10,
      ),
      plan('Monter : bolognaise, béchamel, feuilles ; finir par la béchamel et le parmesan', 12, [1, 3]),
      four('Cuire au four', 40, [2, 4]),
      refroidir(5),
    ],
  },
  {
    id: 'depart-gratin-aubergines',
    nom: 'Gratin d’aubergines à la feta',
    vegetarien: true,
    frigoJours: 3,
    congelateurMois: 2,
    ingredients: [
      '3 aubergines',
      '200 g de feta',
      '1 boîte de tomates concassées (400 g)',
      '1 oignon',
      '2 gousses d’ail',
      '1 c. à c. d’origan',
      '4 c. à s. d’huile d’olive',
      'sel',
      'poivre',
    ],
    etapes: [
      four('Préchauffer le four à 200 °C', 15),
      plan('Couper les aubergines en rondelles et les badigeonner d’huile', 8),
      four('Rôtir les aubergines', 20, [1, 2]),
      plan('Émincer l’oignon et l’ail', 4),
      feu('Faire revenir l’oignon et l’ail, ajouter les tomates et l’origan ; mijoter', false, 15, [4]),
      plan('Monter : aubergines, sauce, feta émiettée', 6, [3, 5]),
      four('Gratiner au four', 25, [6]),
      refroidir(7),
    ],
  },
  {
    id: 'depart-quiche-sans-pate',
    nom: 'Quiche sans pâte',
    vegetarien: false,
    frigoJours: 3,
    congelateurMois: 2,
    ingredients: [
      '3 œufs',
      '60 g de farine',
      '25 cl de lait',
      '20 cl de crème liquide',
      '150 g de lardons',
      '80 g de gruyère râpé',
      '1 pincée de muscade',
      'poivre',
    ],
    etapes: [
      four('Préchauffer le four à 180 °C', 15),
      feu('Faire dorer les lardons à sec', true, 5),
      plan('Battre les œufs avec la farine, puis le lait, la crème, la muscade et le poivre', 5),
      plan('Verser dans le moule beurré avec les lardons et le gruyère', 3, [2, 3]),
      four('Cuire au four', 40, [1, 4]),
      refroidir(5),
    ],
  },
  {
    id: 'depart-quiche-lorraine',
    nom: 'Quiche lorraine',
    vegetarien: false,
    frigoJours: 3,
    congelateurMois: 2,
    ingredients: [
      '1 pâte brisée',
      '200 g de lardons',
      '3 œufs',
      '20 cl de crème liquide',
      '20 cl de lait',
      '1 pincée de muscade',
      'poivre',
    ],
    etapes: [
      four('Préchauffer le four à 200 °C', 15),
      plan('Foncer le moule avec la pâte et la piquer à la fourchette', 4),
      four('Précuire la pâte à blanc', 10, [1, 2]),
      feu('Faire dorer les lardons à sec', true, 5),
      plan('Battre les œufs avec la crème, le lait, la muscade et le poivre', 4),
      plan('Garnir la pâte de lardons et verser l’appareil', 2, [3, 4, 5]),
      four('Cuire au four à 180 °C', 30, [6]),
      refroidir(7),
    ],
  },
  {
    id: 'depart-omelette-normande',
    nom: 'Omelette normande',
    precision: 'Version salée',
    vegetarien: false,
    frigoJours: 2,
    congelateurMois: null,
    ingredients: [
      '8 œufs',
      '500 g de pommes de terre',
      '150 g de lardons',
      '1 oignon',
      '½ camembert',
      '10 cl de crème fraîche',
      '20 g de beurre',
      'sel',
      'poivre',
    ],
    etapes: [
      plan('Éplucher les pommes de terre et les couper en petits dés', 8),
      feu(
        'Faire dorer les pommes de terre au beurre, à couvert, en remuant de temps en temps',
        false,
        20,
        [1],
      ),
      plan('Émincer l’oignon et couper le camembert en tranches', 4),
      feu('Faire revenir les lardons et l’oignon', true, 6, [3]),
      plan('Battre les œufs avec la crème, du sel et du poivre', 3),
      feu(
        'Réunir pommes de terre, lardons et oignon, verser les œufs, poser le camembert ; cuire à couvert à feu doux',
        true,
        8,
        [2, 4, 5],
      ),
      refroidir(6, 20),
    ],
  },
  {
    id: 'depart-brandade',
    nom: 'Brandade de morue',
    vegetarien: false,
    frigoJours: 2,
    congelateurMois: 3,
    note: 'Dessalage au frigo, au moins 24 h, en changeant l’eau 3 ou 4 fois.',
    ingredients: [
      '500 g de morue salée',
      '600 g de pommes de terre',
      '2 gousses d’ail',
      '10 cl d’huile d’olive',
      '25 cl de lait',
      '1 feuille de laurier',
      '½ botte de persil',
      'poivre',
      '30 g de chapelure (facultatif)',
    ],
    etapes: [
      {
        texte: 'Dessaler la morue dans l’eau froide, au frigo, en changeant l’eau 3 ou 4 fois',
        poste: 'repos',
        actif: false,
        duree: 1440,
        veille: true,
      },
      plan('Éplucher les pommes de terre', 8),
      feu('Cuire les pommes de terre', false, 25, [2]),
      feu('Pocher la morue dans le lait avec le laurier, sans bouillir', false, 10, [1]),
      plan('Effeuiller la morue en retirant la peau et les arêtes', 8, [4]),
      plan(
        'Écraser les pommes de terre et la morue avec l’ail, l’huile et un peu du lait chaud ; ajouter le persil',
        10,
        [3, 5],
      ),
      { ...four('Parsemer de chapelure et gratiner au four à 200 °C', 15, [6]), facultative: true },
      refroidir(7),
    ],
  },
];

const DATE_DE_DEPART = '2026-11-25T00:00:00.000Z';

function construireEtapes(id: string, etapes: EtapeDeDepart[]): Etape[] {
  return etapes.map((e, i) => ({
    id: `${id}-e${i + 1}`,
    texte: e.texte,
    poste: e.poste,
    dureeMin: e.duree,
    active: e.actif,
    apres: (e.apres ?? []).map((n) => `${id}-e${n}`),
    facultative: e.facultative ?? false,
    anticiper: e.veille ? 'veille' : null,
    devinee: false,
    sousRecetteId: e.sousRecette ?? null,
  }));
}

function construireIngredients(lignes: RecetteDeDepart['ingredients']): Ingredient[] {
  return lignes.map((ligne) =>
    typeof ligne === 'string'
      ? analyserIngredient(ligne)
      : {
          texte: ligne.texte,
          quantite: 4,
          unite: 'portions',
          nom: 'bolognaise',
          precision: null,
          facultatif: false,
          cle: ligne.sousRecette,
          rayon: 'autre',
          recetteId: ligne.sousRecette,
        },
  );
}

export function construireRecetteDeDepart(d: RecetteDeDepart): Recette {
  return {
    id: d.id,
    nom: d.nom,
    sousTitre: d.precision ?? null,
    note: d.note ?? null,
    portions: 4,
    vegetarien: d.vegetarien,
    ingredients: construireIngredients(d.ingredients),
    etapes: construireEtapes(d.id, d.etapes),
    conservation: { frigoJours: d.frigoJours, congelateurMois: d.congelateurMois },
    origine: { type: 'depart', de: null, mot: null, source: null },
    texteOriginal: null,
    photos: [],
    creeLe: DATE_DE_DEPART,
    modifieLe: DATE_DE_DEPART,
  };
}

export const recettesDeDepart = (): Recette[] => RECETTES_DE_DEPART.map(construireRecetteDeDepart);
