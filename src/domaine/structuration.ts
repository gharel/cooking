import { reperer } from './dictionnaire';
import { FORMES_D_UNITES, lireQuantite, uniteAffichee } from './ingredients';
import type { Etape, Ingredient, Poste } from './modele';
import { normaliser, normaliserAvecIndex } from './texte';

interface Verbe {
  motifs: string[];
  poste: Poste;
  active: boolean;
  duree: number;
  /** Verbe d’assemblage (ajouter, verser…) : il se rattache à l’action qui suit dans la phrase. */
  leger?: boolean;
  veille?: boolean;
}

const VERBES: Verbe[] = [
  {
    motifs: ['laisser refroidir', 'refroidir', 'laisser tiedir', 'tiedir'],
    poste: 'repos',
    active: false,
    duree: 30,
  },
  {
    motifs: ['laisser reposer', 'reposer', 'laisser mariner', 'mariner'],
    poste: 'repos',
    active: false,
    duree: 15,
  },
  { motifs: ['faire dessaler', 'dessaler'], poste: 'repos', active: false, duree: 1440, veille: true },
  { motifs: ['prechauffer'], poste: 'four', active: false, duree: 15 },
  { motifs: ['faire gratiner', 'gratiner'], poste: 'four', active: false, duree: 15 },
  { motifs: ['enfourner', 'faire rotir', 'rotir'], poste: 'four', active: false, duree: 30 },
  {
    motifs: [
      'faire revenir',
      'revenir',
      'faire dorer',
      'dorer',
      'saisir',
      'faire sauter',
      'sauter',
      'faire suer',
    ],
    poste: 'feu',
    active: true,
    duree: 10,
  },
  { motifs: ['faire fondre', 'fondre'], poste: 'feu', active: true, duree: 5 },
  { motifs: ['laisser mijoter', 'faire mijoter', 'mijoter'], poste: 'feu', active: false, duree: 30 },
  {
    motifs: [
      'faire pocher',
      'pocher',
      'faire blanchir',
      'blanchir',
      'faire bouillir',
      'bouillir',
      'porter a ebullition',
    ],
    poste: 'feu',
    active: false,
    duree: 10,
  },
  { motifs: ['faire cuire', 'cuire'], poste: 'feu', active: false, duree: 20 },
  { motifs: ['eplucher', 'peler', 'couper', 'decouper', 'tailler'], poste: 'plan', active: true, duree: 10 },
  { motifs: ['emincer', 'hacher', 'ciseler', 'raper', 'effeuiller'], poste: 'plan', active: true, duree: 5 },
  { motifs: ['ecraser', 'mixer', 'reduire en puree'], poste: 'plan', active: true, duree: 8 },
  {
    motifs: [
      'monter',
      'dresser',
      'etaler',
      'garnir',
      'foncer',
      'repartir',
      'disposer',
      'beurrer',
      'badigeonner',
      'portionner',
    ],
    poste: 'plan',
    active: true,
    duree: 5,
  },
  { motifs: ['battre', 'fouetter', 'melanger', 'rincer', 'egoutter'], poste: 'plan', active: true, duree: 3 },
  {
    motifs: ['ajouter', 'verser', 'mettre', 'incorporer', 'assaisonner', 'saler', 'poivrer', 'parsemer'],
    poste: 'plan',
    active: true,
    duree: 3,
    leger: true,
  },
];

const FORMES_VERBES = VERBES.flatMap((v) => v.motifs.map((m) => ({ verbe: v, motif: m }))).sort(
  (a, b) => b.motif.length - a.motif.length,
);

function verbeDe(fragment: string): Verbe | null {
  const n = normaliser(fragment).trim();
  const trouve = FORMES_VERBES.find(
    ({ motif }) => n.startsWith(motif) && /^(?![a-z])/.test(n.slice(motif.length)),
  );
  return trouve?.verbe ?? null;
}

/** Durée écrite dans le texte : « 25 min », « 1 h 30 », « 24 h », « une demi-heure ». */
export function lireDuree(fragment: string): number | null {
  const n = normaliser(fragment);
  const heures = /(\d+)\s*h(?:eures?)?(?![a-z])(?:\s*(\d{1,2}))?/.exec(n);
  if (heures) return Number(heures[1]) * 60 + Number(heures[2] ?? 0);
  const minutes = /(\d+)\s*min(?:utes?)?(?![a-z])/.exec(n);
  if (minutes) return Number(minutes[1]);
  if (/une demi[- ]heure/.test(n)) return 30;
  if (/un quart d'heure/.test(n)) return 15;
  if (/une heure/.test(n)) return 60;
  return null;
}

const ENTREE_DE_PHRASE = /^(pendant ce temps|en meme temps|la veille|ensuite|puis|enfin|d'abord)\s*,?\s*/;

interface Proposition {
  texte: string;
  verbe: Verbe | null;
  /** Séparateur qui la précédait dans la phrase (« , », « et », « puis »), pour recoller sans rien perdre. */
  separateur: string;
}

function decouperPhrase(phrase: string): Proposition[] {
  const morceaux = phrase.split(/(,\s+|\s+et\s+|\s+puis\s+)/);
  const propositions: Proposition[] = [];
  let courante: Proposition = { texte: morceaux[0] ?? '', verbe: verbeDe(morceaux[0] ?? ''), separateur: '' };
  for (let i = 1; i < morceaux.length; i += 2) {
    const separateur = morceaux[i] ?? '';
    const morceau = morceaux[i + 1] ?? '';
    const verbe = verbeDe(morceau);
    if (verbe) {
      propositions.push(courante);
      courante = { texte: morceau, verbe, separateur };
    } else {
      courante = { ...courante, texte: courante.texte + separateur + morceau };
    }
  }
  propositions.push(courante);

  // Un verbe d’assemblage se rattache à l’action suivante : « ajouter les lentilles, laisser mijoter ».
  const rattachees: Proposition[] = [];
  for (let i = 0; i < propositions.length; i++) {
    const p = propositions[i];
    const suivante = propositions[i + 1];
    if (p && suivante && p.verbe?.leger) {
      propositions[i + 1] = {
        texte: p.texte + suivante.separateur + suivante.texte,
        verbe: suivante.verbe,
        separateur: p.separateur,
      };
    } else if (p) {
      rattachees.push(p);
    }
  }
  return rattachees;
}

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Propose des étapes à partir d’un texte libre « tel qu’on le raconte ». Rien n’est définitif : l’utilisateur vérifie. */
export function proposerEtapes(texte: string): Etape[] {
  const phrases = texte
    .split(/(?<=[.!?;])\s+(?=\p{Lu})|\n+/u)
    .map((p) =>
      p
        .trim()
        .replace(/[.;!?]+$/, '')
        .trim(),
    )
    .filter(Boolean);

  const etapes: Etape[] = [];
  let dernierGroupe: string[] = [];
  for (const phraseBrute of phrases) {
    const entree = ENTREE_DE_PHRASE.exec(normaliser(phraseBrute));
    const parallele = entree?.[1] === 'pendant ce temps' || entree?.[1] === 'en meme temps';
    const veille = entree?.[1] === 'la veille';
    const phrase = entree ? phraseBrute.slice(entree[0].length) : phraseBrute;

    decouperPhrase(phrase).forEach((p, rang) => {
      const id = `e${etapes.length + 1}`;
      const ecrite = lireDuree(p.texte);
      const verbe = p.verbe;
      const auFour = /\bau four\b/.test(normaliser(p.texte));
      const poste: Poste = verbe ? (auFour && verbe.poste === 'feu' ? 'four' : verbe.poste) : 'plan';
      const parDefaut = verbe ? (poste === 'four' && verbe.poste === 'feu' ? 30 : verbe.duree) : 5;
      const enParallele = parallele && rang === 0 && etapes.length > 0;
      const precedente = etapes[etapes.length - 1];
      const apres = enParallele ? [...(precedente?.apres ?? [])] : [...dernierGroupe];
      etapes.push({
        id,
        texte: majuscule(p.texte.trim()),
        poste,
        dureeMin: ecrite ?? parDefaut,
        active: verbe?.active ?? true,
        apres,
        facultative: false,
        anticiper: veille || verbe?.veille ? 'veille' : null,
        devinee: ecrite === null,
        sousRecetteId: null,
      });
      dernierGroupe = enParallele ? [...dernierGroupe, id] : [id];
    });
  }
  return etapes;
}

const NOMBRES: Readonly<Record<string, number>> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  huit: 8,
  dix: 10,
};

const QUANTITE_AVANT = new RegExp(
  `(?<![a-z0-9])(\\d+(?:[.,]\\d+)?|[½¼¾]|${Object.keys(NOMBRES).join('|')})\\s+(?:(${FORMES_D_UNITES.map(
    (f) => f.replace(/\./g, '\\.'),
  ).join('|')})\\s+)?(?:de |d')?$`,
);

/** Repère les ingrédients connus d’un texte libre, avec leur quantité quand elle les précède. */
export function extraireIngredients(texte: string): Ingredient[] {
  const { texte: n, origine } = normaliserAvecIndex(texte);
  const vus = new Set<string>();
  const ingredients: Ingredient[] = [];
  for (const occ of reperer(n)) {
    if (vus.has(occ.cle)) continue;
    vus.add(occ.cle);
    const avant = n.slice(Math.max(0, occ.debut - 40), occ.debut);
    const q = QUANTITE_AVANT.exec(avant);
    const debut = q ? occ.debut - q[0].length : occ.debut;
    const versOrigine = (i: number) => origine[i] ?? texte.length;
    const texteOrigine = texte.slice(versOrigine(debut), versOrigine(occ.fin - 1) + 1);
    const nom = texte.slice(versOrigine(occ.debut), versOrigine(occ.fin - 1) + 1);
    const mot = q?.[1] ?? '';
    ingredients.push({
      texte: texteOrigine,
      quantite: q ? (NOMBRES[mot] ?? lireQuantite(mot)) : null,
      unite: q?.[2] ? uniteAffichee(q[2]) : null,
      nom,
      precision: null,
      facultatif: false,
      cle: occ.cle,
      rayon: occ.rayon,
      recetteId: null,
    });
  }
  return ingredients;
}

export function structurer(texte: string): { etapes: Etape[]; ingredients: Ingredient[] } {
  return { etapes: proposerEtapes(texte), ingredients: extraireIngredients(texte) };
}
