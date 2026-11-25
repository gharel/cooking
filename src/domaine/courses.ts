import { RAYONS, type Rayon } from './dictionnaire';
import type { PlatDeFournee } from './fournee';
import type { Ingredient, Recette } from './modele';
import { arrondirQuantite, formaterQuantite, liaison, texteQuantite, uniteAccordee } from './portions';

/** Basiques supposés au placard : à part dans les courses, déplaçables d’un geste. */
export const PLACARD_PAR_DEFAUT: readonly string[] = [
  'sel',
  'poivre',
  'huile',
  'huile-olive',
  'curry',
  'curcuma',
  'cumin',
  'paprika',
  'piment',
  'herbes-de-provence',
  'origan',
  'thym',
  'laurier',
  'muscade',
  'vinaigre',
  'moutarde',
];

export interface Part {
  recette: string;
  texte: string;
}

export interface LigneCourses {
  cle: string;
  rayon: Rayon;
  texte: string;
  parts: Part[];
  facultatif: boolean;
}

export interface ListeCourses {
  rayons: { rayon: Rayon; nom: string; lignes: LigneCourses[] }[];
  placard: LigneCourses[];
  total: number;
}

interface Besoin {
  ingredient: Ingredient;
  quantite: number | null;
  recette: string;
}

/** Ingrédients nécessaires, sous-recettes développées (la lasagne ajoute la bolognaise). */
export function besoins(plats: readonly PlatDeFournee[], recettes: readonly Recette[]): Besoin[] {
  const parId = new Map(recettes.map((r) => [r.id, r]));
  const liste: Besoin[] = [];
  const developper = (recette: Recette, facteur: number, libelle: string, profondeur: number) => {
    for (const i of recette.ingredients) {
      const sous = i.recetteId ? parId.get(i.recetteId) : undefined;
      if (sous && profondeur < 3) {
        const portions = (i.quantite ?? sous.portions) * facteur;
        developper(sous, portions / sous.portions, `${libelle} (${sous.nom.toLowerCase()})`, profondeur + 1);
      } else if (!i.recetteId) {
        liste.push({
          ingredient: i,
          quantite: i.quantite === null ? null : i.quantite * facteur,
          recette: libelle,
        });
      }
    }
  };
  for (const p of plats) {
    const r = parId.get(p.recetteId);
    if (r) developper(r, p.portions / r.portions, r.nom, 0);
  }
  return liste;
}

const MASSES: Readonly<Record<string, number>> = { g: 1, kg: 1000 };
const VOLUMES: Readonly<Record<string, number>> = { ml: 1, cl: 10, dl: 100, l: 1000 };

const decimal = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',');

function formaterMasse(g: number): string {
  return g >= 1000 ? `${decimal(g / 1000)} kg` : `${arrondirQuantite(g, 'g', '')} g`;
}
function formaterVolume(ml: number): string {
  if (ml >= 1000) return `${decimal(ml / 1000)} l`;
  return ml % 10 === 0 || ml >= 50 ? `${Math.max(1, Math.round(ml / 10))} cl` : `${Math.round(ml)} ml`;
}

const nomCourt = (noms: string[]) => noms.reduce((a, b) => (b.length < a.length ? b : a));

function ligne(cle: string, rayon: Rayon, liste: Besoin[]): LigneCourses {
  const nom = nomCourt(liste.map((b) => b.ingredient.nom));
  let masse = 0;
  let volume = 0;
  const autres = new Map<string, number>();
  let sansQuantite = false;
  for (const b of liste) {
    const u = b.ingredient.unite;
    if (b.quantite === null) sansQuantite = true;
    else if (u && MASSES[u]) masse += b.quantite * (MASSES[u] ?? 1);
    else if (u && VOLUMES[u]) volume += b.quantite * (VOLUMES[u] ?? 1);
    else autres.set(u ?? '', (autres.get(u ?? '') ?? 0) + b.quantite);
  }
  const morceaux: string[] = [];
  const pieces = autres.get('');
  autres.delete('');
  for (const [unite, q] of autres) {
    const arrondi = arrondirQuantite(q, unite, nom);
    morceaux.push(
      `${formaterQuantite(arrondi)} ${unite.startsWith('c.') ? unite : uniteAccordee(unite, arrondi)}`,
    );
  }
  if (masse > 0) morceaux.push(formaterMasse(masse));
  if (volume > 0) morceaux.push(formaterVolume(volume));

  let texte: string;
  if (pieces !== undefined && morceaux.length === 0) {
    texte = texteQuantite(arrondirQuantite(pieces, null, nom), null, nom);
  } else if (morceaux.length > 0) {
    const debut = pieces !== undefined ? `${formaterQuantite(arrondirQuantite(pieces, null, nom))} + ` : '';
    texte = `${debut}${morceaux.join(' + ')} ${liaison(nom)}${nom}`;
  } else {
    texte = nom.charAt(0).toUpperCase() + nom.slice(1);
  }
  if (sansQuantite && (morceaux.length > 0 || pieces !== undefined) && !/^sel|^poivre/.test(cle))
    texte += ' (et selon la recette)';
  const facultatif = liste.every((b) => b.ingredient.facultatif);
  if (facultatif) texte += ' (facultatif)';

  const parts: Part[] = liste.map((b) => ({
    recette: b.recette,
    texte:
      b.quantite === null
        ? b.ingredient.texte
        : b.ingredient.unite
          ? `${formaterQuantite(arrondirQuantite(b.quantite, b.ingredient.unite, b.ingredient.nom))} ${b.ingredient.unite}`
          : formaterQuantite(arrondirQuantite(b.quantite, null, b.ingredient.nom)),
  }));
  return { cle, rayon, texte, parts, facultatif };
}

const ORDRE_RAYONS = Object.keys(RAYONS) as Rayon[];

/** Liste consolidée : une ligne par ingrédient, rangée par rayon ; les basiques du placard à part. */
export function listeDeCourses(
  plats: readonly PlatDeFournee[],
  recettes: readonly Recette[],
  placard: readonly string[],
): ListeCourses {
  const parCle = new Map<string, Besoin[]>();
  for (const b of besoins(plats, recettes)) {
    const l = parCle.get(b.ingredient.cle) ?? [];
    l.push(b);
    parCle.set(b.ingredient.cle, l);
  }
  const lignes = [...parCle.entries()]
    .map(([cle, liste]) => ligne(cle, liste[0]?.ingredient.rayon ?? 'autre', liste))
    .sort((a, b) => a.texte.localeCompare(b.texte, 'fr'));
  const auPlacard = new Set(placard);
  const aAcheter = lignes.filter((l) => !auPlacard.has(l.cle));
  return {
    rayons: ORDRE_RAYONS.map((rayon) => ({
      rayon,
      nom: RAYONS[rayon],
      lignes: aAcheter.filter((l) => l.rayon === rayon),
    })).filter((r) => r.lignes.length > 0),
    placard: lignes.filter((l) => auPlacard.has(l.cle)),
    total: aAcheter.length,
  };
}

/** Texte à partager (SMS, messagerie, notes). */
export function texteDesCourses(liste: ListeCourses, cochees: readonly string[] = []): string {
  const faites = new Set(cochees);
  const blocs = liste.rayons
    .map((r) => ({ nom: r.nom, lignes: r.lignes.filter((l) => !faites.has(l.cle)) }))
    .filter((r) => r.lignes.length > 0)
    .map((r) => `${r.nom}\n${r.lignes.map((l) => `- ${l.texte}`).join('\n')}`);
  return ['Courses Fournée', ...blocs].join('\n\n');
}
