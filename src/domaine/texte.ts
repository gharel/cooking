const DIACRITIQUES = /\p{Diacritic}/gu;

function normaliserCaractere(c: string): string {
  if (c === 'œ' || c === 'Œ') return 'oe';
  if (c === 'æ' || c === 'Æ') return 'ae';
  if (c === '’' || c === 'ʼ') return "'";
  return c.normalize('NFD').replace(DIACRITIQUES, '').toLowerCase();
}

/** Minuscules, sans accents, « œ » devient « oe », apostrophe droite : pour comparer et rechercher. */
export function normaliser(texte: string): string {
  return [...texte].map(normaliserCaractere).join('');
}

/**
 * Comme `normaliser`, avec pour chaque caractère du résultat l’indice du caractère d’origine :
 * permet de retrouver le texte saisi à partir d’une correspondance trouvée dans le texte normalisé.
 */
export function normaliserAvecIndex(texte: string): { texte: string; origine: number[] } {
  let resultat = '';
  const origine: number[] = [];
  let i = 0;
  for (const c of texte) {
    const n = normaliserCaractere(c);
    for (let k = 0; k < n.length; k++) origine.push(i);
    resultat += n;
    i += c.length;
  }
  return { texte: resultat, origine };
}

/** Identifiant lisible : « Bœuf haché » donne « boeuf-hache ». */
export function slug(texte: string): string {
  return normaliser(texte)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** 45 donne « 45 min », 70 donne « 1 h 10 », 1440 donne « 24 h ». */
export function formaterDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}
