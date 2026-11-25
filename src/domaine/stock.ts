import { besoins } from './courses';
import { ajouterJours, ajouterMois, dateLongue, ecartJours, nomDuJour, type DateISO } from './dates';
import type { Fournee, PlatDeFournee } from './fournee';
import type { Recette } from './modele';
import { formaterQuantite, liaison, uniteAccordee } from './portions';

export type Lieu = 'frigo' | 'congelateur';

/** Plat préparé, au frigo ou au congélateur. */
export interface Plat {
  id: string;
  recetteId: string | null;
  nom: string;
  portions: number;
  lieu: Lieu;
  prepareLe: DateISO;
  /** Date limite conseillée (à consommer au plus tard ce jour-là). */
  limite: DateISO;
  fourneeId: string | null;
}

/** Ingrédient qui reste dans le frigo. */
export interface Reste {
  id: string;
  nom: string;
  cle: string;
  quantite: number | null;
  unite: string | null;
  vite: boolean;
  ajouteLe: DateISO;
}

/** Au frigo, un plat décongelé se mange sous 24 h. */
export const JOURS_APRES_DECONGELATION = 1;

export type Niveau = 'depasse' | 'aujourdhui' | 'bientot' | 'ok';

export interface Fraicheur {
  joursRestants: number;
  niveau: Niveau;
  /** Part de la durée de conservation qui reste, de 0 à 1. */
  part: number;
}

export function fraicheur(p: Plat, aujourdhui: DateISO): Fraicheur {
  const joursRestants = ecartJours(aujourdhui, p.limite);
  const total = Math.max(1, ecartJours(p.prepareLe, p.limite));
  const seuil = p.lieu === 'frigo' ? 1 : 14;
  const niveau: Niveau =
    joursRestants < 0
      ? 'depasse'
      : joursRestants === 0
        ? 'aujourdhui'
        : joursRestants <= seuil
          ? 'bientot'
          : 'ok';
  return { joursRestants, niveau, part: Math.min(1, Math.max(0, joursRestants / total)) };
}

/** Une portion mangée ; null quand il n’en reste plus. */
export const mangerPortion = (p: Plat): Plat | null =>
  p.portions > 1 ? { ...p, portions: p.portions - 1 } : null;

export function congeler(p: Plat, mois: number | null, aujourdhui: DateISO): Plat {
  return { ...p, lieu: 'congelateur', limite: ajouterMois(aujourdhui, mois ?? 3) };
}

/** Sort n portions du congélateur : elles passent au frigo, à manger sous 24 h. */
export function decongeler(
  p: Plat,
  n: number,
  aujourdhui: DateISO,
  identifiant: () => string,
): { reste: Plat | null; sorti: Plat } {
  const portions = Math.min(Math.max(1, n), p.portions);
  return {
    reste: portions < p.portions ? { ...p, portions: p.portions - portions } : null,
    sorti: {
      ...p,
      id: identifiant(),
      portions,
      lieu: 'frigo',
      limite: ajouterJours(aujourdhui, JOURS_APRES_DECONGELATION),
    },
  };
}

export interface AlerteStock {
  platId: string;
  niveau: Niveau;
  texte: string;
}

export function alertesStock(plats: readonly Plat[], aujourdhui: DateISO): AlerteStock[] {
  return plats
    .map((p) => ({ p, f: fraicheur(p, aujourdhui) }))
    .filter(
      ({ p, f }) =>
        f.niveau === 'depasse' || f.niveau === 'aujourdhui' || (p.lieu === 'frigo' && f.niveau === 'bientot'),
    )
    .sort((a, b) => a.f.joursRestants - b.f.joursRestants)
    .map(({ p, f }) => ({
      platId: p.id,
      niveau: f.niveau,
      texte:
        f.niveau === 'depasse'
          ? `${p.nom} : date conseillée dépassée (${dateLongue(p.limite)}).`
          : f.niveau === 'aujourdhui'
            ? `${p.nom} : à manger aujourd’hui.`
            : `${p.nom} : à manger d’ici ${nomDuJour(p.limite)}.`,
    }));
}

export interface Rappel {
  jour: DateISO;
  texte: string;
}

/**
 * Rappels de décongélation, la veille au soir : repas servis par un plat du congélateur (planning courant),
 * et repas tardifs de la dernière session dont les portions ont été congelées.
 */
export function rappelsDecongelation(
  fournees: readonly Fournee[],
  plats: readonly Plat[],
  recettes: readonly Recette[],
  personnes: number,
  aujourdhui: DateISO,
): Rappel[] {
  const parId = new Map(plats.map((p) => [p.id, p]));
  const recettesParId = new Map(recettes.map((r) => [r.id, r]));
  const rappels: Rappel[] = [];
  for (const f of fournees) {
    for (const r of f.repas) {
      const veille = ajouterJours(r.jour, -1);
      if (ecartJours(aujourdhui, veille) < 0) continue;
      let nom: string | null = null;
      const plat = r.platId ? parId.get(r.platId) : undefined;
      if (plat?.lieu === 'congelateur') nom = plat.nom;
      else if (!r.platId && r.recetteId && f.statut === 'terminee') {
        const recette = recettesParId.get(r.recetteId);
        const congele = plats.some(
          (p) => p.lieu === 'congelateur' && p.fourneeId === f.id && p.recetteId === r.recetteId,
        );
        if (recette && congele && ecartJours(f.sessionLe, r.jour) > recette.conservation.frigoJours)
          nom = recette.nom;
      }
      if (nom)
        rappels.push({
          jour: veille,
          texte: `${dateLongue(veille)} au soir : sortir ${personnes} portion${personnes > 1 ? 's' : ''} de ${nom} pour ${nomDuJour(r.jour)} ${r.moment}.`,
        });
    }
  }
  return rappels.sort((a, b) => a.jour.localeCompare(b.jour));
}

const ACHAT_ENTIER = new Set(['botte', 'boîte', 'sachet', '']);

/**
 * Restes probables après une session : ce qu’on achète entier (botte, boîte, pièce) mais qu’on n’utilise
 * qu’en partie (½ botte de coriandre).
 */
export function restesProbables(
  plats: readonly PlatDeFournee[],
  recettes: readonly Recette[],
  placard: readonly string[],
): { nom: string; cle: string; quantite: number; unite: string | null }[] {
  const auPlacard = new Set(placard);
  const totaux = new Map<string, { q: number; unite: string; nom: string }>();
  for (const b of besoins(plats, recettes)) {
    const unite = b.ingredient.unite ?? '';
    if (b.quantite === null || auPlacard.has(b.ingredient.cle) || !ACHAT_ENTIER.has(unite)) continue;
    const cle = `${b.ingredient.cle}|${unite}`;
    const t = totaux.get(cle) ?? { q: 0, unite, nom: b.ingredient.nom };
    totaux.set(cle, { ...t, q: t.q + b.quantite });
  }
  const restes = [];
  for (const [cle, t] of totaux) {
    const reste = Math.ceil(t.q - 1e-9) - t.q;
    if (reste < 0.2) continue;
    const q = Math.round(reste * 4) / 4;
    const nom = t.unite
      ? `${formaterQuantite(q)} ${uniteAccordee(t.unite, q)} ${liaison(t.nom)}${t.nom}`
      : `${formaterQuantite(q)} ${t.nom}`;
    restes.push({ nom, cle: cle.split('|')[0] ?? cle, quantite: q, unite: t.unite || null });
  }
  return restes;
}
