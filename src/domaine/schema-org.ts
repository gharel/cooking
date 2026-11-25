/** Lecture d’une recette publiée sur le web : balisage schema.org `Recipe` (JSON-LD), ou texte brut. */

export interface RecetteImportee {
  nom: string;
  portions: number | null;
  ingredients: string[];
  instructions: string;
  source: string | null;
}

const ENTITES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  hellip: '…',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  ccedil: 'ç',
  ocirc: 'ô',
  ecirc: 'ê',
  deg: '°',
  acirc: 'â',
  icirc: 'î',
  ucirc: 'û',
  ugrave: 'ù',
  iuml: 'ï',
  euml: 'ë',
  oelig: 'œ',
  laquo: '«',
  raquo: '»',
};

/** Retire les balises et décode les entités HTML courantes. */
export function nettoyer(texte: string): string {
  return texte
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, nom: string) => ENTITES[nom.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

type Json = unknown;
const estObjet = (v: Json): v is Record<string, Json> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function estRecette(v: Record<string, Json>): boolean {
  const type = v['@type'];
  return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
}

function trouverRecette(v: Json, profondeur = 0): Record<string, Json> | null {
  if (profondeur > 6) return null;
  if (Array.isArray(v)) {
    for (const x of v) {
      const r = trouverRecette(x, profondeur + 1);
      if (r) return r;
    }
    return null;
  }
  if (!estObjet(v)) return null;
  if (estRecette(v)) return v;
  for (const cle of ['@graph', 'mainEntity', 'itemListElement']) {
    const r = trouverRecette(v[cle], profondeur + 1);
    if (r) return r;
  }
  return null;
}

function instructionsDe(v: Json): string[] {
  if (typeof v === 'string') return [nettoyer(v)];
  if (Array.isArray(v)) return v.flatMap(instructionsDe);
  if (estObjet(v)) {
    if (v.itemListElement) return instructionsDe(v.itemListElement);
    if (typeof v.text === 'string') return [nettoyer(v.text)];
    if (typeof v.name === 'string') return [nettoyer(v.name)];
  }
  return [];
}

function portionsDe(v: Json): number | null {
  const valeurs = Array.isArray(v) ? v : [v];
  for (const x of valeurs) {
    const m = /(\d+)/.exec(String(x ?? ''));
    if (m) return Number(m[1]);
  }
  return null;
}

/** Texte sans balisage : première ligne = titre, lignes à puce ou qui commencent par une quantité = ingrédients. */
function depuisTexte(contenu: string, adresse: string | null): RecetteImportee | null {
  const lignes = nettoyer(contenu.replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n'))
    ? contenu
        .replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n')
        .split('\n')
        .map((l) => nettoyer(l))
        .filter(Boolean)
    : [];
  const [nom, ...reste] = lignes;
  if (!nom) return null;
  const ingredients: string[] = [];
  const instructions: string[] = [];
  for (const l of reste) {
    if (/^(ingr[ée]dients?|pr[ée]paration|instructions?|[ée]tapes?)\s*:?$/i.test(l)) continue;
    const puce = /^[-•*·]\s*(.+)$/.exec(l);
    const numerotee = /^\d+[.)]\s/.test(l);
    if (puce?.[1]) ingredients.push(puce[1]);
    else if (numerotee) instructions.push(l.replace(/^\d+[.)]\s*/, ''));
    else if (
      /^(\d+([.,]\d+)?|[½¼¾])\s*(g|kg|cl|ml|l|c\.|cuill|gousses?|bottes?|bo[iî]tes?|pinc|sachets?)?\b/i.test(
        l,
      ) &&
      l.length < 80 &&
      instructions.length === 0
    )
      ingredients.push(l);
    else instructions.push(l.replace(/^\d+[.)]\s*/, ''));
  }
  return { nom, portions: null, ingredients, instructions: instructions.join('\n'), source: adresse };
}

export function lireRecetteWeb(contenu: string, adresse: string | null = null): RecetteImportee | null {
  const blocs = [...contenu.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1] ?? '',
  );
  const t = contenu.trim();
  if (blocs.length === 0 && (t.startsWith('{') || t.startsWith('['))) blocs.push(t);
  for (const bloc of blocs) {
    let json: Json;
    try {
      json = JSON.parse(bloc);
    } catch {
      continue;
    }
    const r = trouverRecette(json);
    if (!r) continue;
    const ingredients = (
      Array.isArray(r.recipeIngredient)
        ? r.recipeIngredient
        : Array.isArray(r.ingredients)
          ? r.ingredients
          : []
    )
      .map((i) => nettoyer(String(i)))
      .filter(Boolean);
    return {
      nom: nettoyer(String(r.name ?? 'Recette du web')),
      portions: portionsDe(r.recipeYield),
      ingredients,
      instructions: instructionsDe(r.recipeInstructions).filter(Boolean).join('\n'),
      source: adresse ?? (typeof r.url === 'string' ? r.url : null),
    };
  }
  return depuisTexte(contenu, adresse);
}
