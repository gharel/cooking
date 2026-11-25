import { RAYONS } from './dictionnaire';
import { ORIGINES, POSTES, type Etape, type Ingredient, type Recette } from './modele';

export const FORMAT_EXPORT = 'fournee-recettes';
export const VERSION_EXPORT = 1;

export interface PhotoExportee {
  id: string;
  type: string;
  /** Contenu de l’image en base64. */
  donnees: string;
}

export interface Export {
  format: typeof FORMAT_EXPORT;
  version: number;
  exporteLe: string;
  recettes: Recette[];
  photos: PhotoExportee[];
}

export type Lecture = { ok: true; contenu: Export } | { ok: false; erreurs: string[] };

type Objet = Record<string, unknown>;
const estObjet = (v: unknown): v is Objet => typeof v === 'object' && v !== null && !Array.isArray(v);
const estChaine = (v: unknown): v is string => typeof v === 'string';
const estChaineOuNull = (v: unknown): v is string | null => v === null || typeof v === 'string';
const estNombre = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const estNombreOuNull = (v: unknown): v is number | null => v === null || estNombre(v);
const estBooleen = (v: unknown): v is boolean => typeof v === 'boolean';
const estListeDeChaines = (v: unknown): v is string[] => Array.isArray(v) && v.every(estChaine);

function verifierIngredient(v: unknown, chemin: string, erreurs: string[]): v is Ingredient {
  if (!estObjet(v)) return (void erreurs.push(`${chemin} : un ingrédient doit être un objet`), false);
  const champs: [string, (x: unknown) => boolean][] = [
    ['texte', estChaine],
    ['quantite', estNombreOuNull],
    ['unite', estChaineOuNull],
    ['nom', estChaine],
    ['precision', estChaineOuNull],
    ['facultatif', estBooleen],
    ['cle', estChaine],
    ['rayon', (x) => estChaine(x) && x in RAYONS],
    ['recetteId', estChaineOuNull],
  ];
  let valide = true;
  for (const [nom, test] of champs) {
    if (!test(v[nom])) {
      erreurs.push(`${chemin}.${nom} : valeur invalide`);
      valide = false;
    }
  }
  return valide;
}

function verifierEtape(v: unknown, chemin: string, erreurs: string[]): v is Etape {
  if (!estObjet(v)) return (void erreurs.push(`${chemin} : une étape doit être un objet`), false);
  const champs: [string, (x: unknown) => boolean][] = [
    ['id', estChaine],
    ['texte', estChaine],
    ['poste', (x) => estChaine(x) && x in POSTES],
    ['dureeMin', (x) => estNombre(x) && x >= 0],
    ['active', estBooleen],
    ['apres', estListeDeChaines],
    ['facultative', estBooleen],
    ['anticiper', (x) => x === null || x === 'veille'],
    ['devinee', estBooleen],
    ['sousRecetteId', estChaineOuNull],
  ];
  let valide = true;
  for (const [nom, test] of champs) {
    if (!test(v[nom])) {
      erreurs.push(`${chemin}.${nom} : valeur invalide`);
      valide = false;
    }
  }
  return valide;
}

/** Vérifie une recette champ par champ ; renvoie la liste des erreurs (vide si elle est valide). */
export function verifierRecette(v: unknown, chemin = 'recette'): string[] {
  const erreurs: string[] = [];
  if (!estObjet(v)) return [`${chemin} : une recette doit être un objet`];
  if (!estChaine(v.id) || v.id === '') erreurs.push(`${chemin}.id : identifiant manquant`);
  if (!estChaine(v.nom) || v.nom.trim() === '') erreurs.push(`${chemin}.nom : nom manquant`);
  if (!estNombre(v.portions) || v.portions < 1)
    erreurs.push(`${chemin}.portions : nombre de portions invalide`);
  if (!estBooleen(v.vegetarien)) erreurs.push(`${chemin}.vegetarien : valeur invalide`);
  if (!estChaineOuNull(v.texteOriginal)) erreurs.push(`${chemin}.texteOriginal : valeur invalide`);
  if (!estChaineOuNull(v.sousTitre) || !estChaineOuNull(v.note))
    erreurs.push(`${chemin} : sous-titre ou note invalide`);
  if (!estListeDeChaines(v.photos)) erreurs.push(`${chemin}.photos : liste invalide`);
  if (!estChaine(v.creeLe) || !estChaine(v.modifieLe)) erreurs.push(`${chemin} : dates manquantes`);

  const c = v.conservation;
  if (!estObjet(c) || !estNombre(c.frigoJours) || !estNombreOuNull(c.congelateurMois))
    erreurs.push(`${chemin}.conservation : valeur invalide`);

  const o = v.origine;
  if (
    !estObjet(o) ||
    !(estChaine(o.type) && o.type in ORIGINES) ||
    !estChaineOuNull(o.de) ||
    !estChaineOuNull(o.mot) ||
    !estChaineOuNull(o.source)
  )
    erreurs.push(`${chemin}.origine : valeur invalide`);

  if (!Array.isArray(v.ingredients)) erreurs.push(`${chemin}.ingredients : liste manquante`);
  else v.ingredients.forEach((ing, i) => verifierIngredient(ing, `${chemin}.ingredients[${i}]`, erreurs));

  if (!Array.isArray(v.etapes)) erreurs.push(`${chemin}.etapes : liste manquante`);
  else {
    const valides = v.etapes.filter((e, i) => verifierEtape(e, `${chemin}.etapes[${i}]`, erreurs)) as Etape[];
    const ids = new Set(valides.map((e) => e.id));
    if (ids.size !== valides.length) erreurs.push(`${chemin}.etapes : identifiants en double`);
    for (const e of valides)
      for (const d of e.apres)
        if (!ids.has(d))
          erreurs.push(`${chemin}.etapes : l’étape ${e.id} dépend d’une étape inconnue (${d})`);
  }
  return erreurs;
}

/** Lit un export Fournée (déjà décodé du JSON). Refuse tout fichier dont un seul élément est invalide. */
export function lireExport(donnees: unknown): Lecture {
  if (!estObjet(donnees) || donnees.format !== FORMAT_EXPORT)
    return { ok: false, erreurs: ['Ce fichier n’est pas un export de recettes Fournée.'] };
  if (donnees.version !== VERSION_EXPORT)
    return { ok: false, erreurs: [`Version d’export non prise en charge : ${String(donnees.version)}.`] };
  if (!Array.isArray(donnees.recettes) || !Array.isArray(donnees.photos) || !estChaine(donnees.exporteLe))
    return { ok: false, erreurs: ['Export incomplet : recettes, photos ou date manquantes.'] };

  const erreurs = donnees.recettes.flatMap((r, i) => verifierRecette(r, `recettes[${i}]`));
  donnees.photos.forEach((p, i) => {
    if (!estObjet(p) || !estChaine(p.id) || !estChaine(p.type) || !estChaine(p.donnees))
      erreurs.push(`photos[${i}] : photo invalide`);
  });
  const photos = new Set((donnees.photos as Objet[]).map((p) => p.id));
  (donnees.recettes as Objet[]).forEach((r, i) => {
    if (estListeDeChaines(r.photos))
      for (const id of r.photos)
        if (!photos.has(id)) erreurs.push(`recettes[${i}].photos : photo ${id} absente du fichier`);
  });
  if (erreurs.length > 0) return { ok: false, erreurs };
  return { ok: true, contenu: donnees as unknown as Export };
}
