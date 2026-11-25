import { ajouterJours, ajouterMois, ecartJours, type DateISO } from './dates';
import type { EtatSession, Fournee } from './fournee';
import { estCongelable, type Recette } from './modele';
import type { Placement, Planning, Tache } from './ordonnanceur';
import type { Plat } from './stock';

/** Minutes écoulées depuis le lancement. */
export const minutesEcoulees = (s: EtatSession, maintenantMs: number): number =>
  Math.max(0, (maintenantMs - s.debut) / 60_000);

/**
 * Placements figés vus à l’instant m : une tâche active non terminée dure au moins jusqu’à maintenant
 * (le cuisinier n’a pas dit « terminé »).
 */
export function figeesEffectives(
  s: EtatSession,
  taches: readonly Tache[],
  m: number,
): Record<string, Placement> {
  const parId = new Map(taches.map((t) => [t.id, t]));
  const faites = new Set(s.faites);
  const resultat: Record<string, Placement> = {};
  for (const [id, p] of Object.entries(s.figees)) {
    const t = parId.get(id);
    if (!t) continue;
    resultat[id] = t.active && !faites.has(id) ? { ...p, fin: Math.max(p.fin, m) } : p;
  }
  return resultat;
}

export const estTerminee = (s: EtatSession, taches: readonly Tache[], id: string, m: number): boolean => {
  if (s.faites.includes(id)) return true;
  const p = s.figees[id];
  const t = taches.find((x) => x.id === id);
  return Boolean(p && t && !t.active && p.fin <= m);
};

/**
 * Tâches du plan qui commencent réellement maintenant : dépendances vraiment terminées et, pour une tâche
 * active, cuisinier libre (aucune autre tâche active en cours pour lui).
 */
export function nouvellesFigees(
  s: EtatSession,
  planning: Pick<Planning, 'taches' | 'placements'>,
  m: number,
): Placement[] {
  const parId = new Map(planning.taches.map((t) => [t.id, t]));
  const faites = new Set(s.faites);
  const occupes = new Set(
    Object.entries(s.figees)
      .filter(([id]) => parId.get(id)?.active && !faites.has(id))
      .map(([, p]) => p.cuisinier),
  );
  const nouvelles: Placement[] = [];
  for (const p of [...planning.placements].sort((a, b) => a.debut - b.debut)) {
    if (s.figees[p.id] || p.debut > m + 1e-6) continue;
    const t = parId.get(p.id);
    if (!t) continue;
    if (!t.apres.every((d) => !parId.has(d) || estTerminee(s, planning.taches, d, m))) continue;
    if (t.active) {
      if (occupes.has(p.cuisinier)) continue;
      occupes.add(p.cuisinier);
    }
    nouvelles.push(p);
  }
  return nouvelles;
}

/** Étape active terminée maintenant (ou passive arrêtée plus tôt). */
export function terminer(s: EtatSession, id: string, m: number): EtatSession {
  const p = s.figees[id];
  const debut = p?.debut ?? m;
  return {
    ...s,
    figees: {
      ...s.figees,
      [id]: {
        ...(p ?? { id, voie: 'plan 1', cuisinier: 1, temperature: null }),
        debut,
        fin: Math.max(debut, m),
      },
    },
    faites: s.faites.includes(id) ? s.faites : [...s.faites, id],
  };
}

/** Étape facultative passée : elle ne prend pas de temps. */
export function passer(s: EtatSession, id: string, m: number, placement: Placement): EtatSession {
  const debut = s.figees[id]?.debut ?? m;
  return {
    ...s,
    figees: { ...s.figees, [id]: { ...placement, debut, fin: debut } },
    faites: [...s.faites.filter((x) => x !== id), id],
  };
}

/** Une étape active prend plus longtemps que prévu. */
export function prolonger(s: EtatSession, id: string, m: number, minutes: number): EtatSession {
  const p = s.figees[id];
  if (!p) return s;
  return { ...s, figees: { ...s.figees, [id]: { ...p, fin: Math.max(p.fin, m) + minutes } } };
}

/**
 * Plats rangés en fin de session : les portions prévues au-delà de la conservation au frigo vont au
 * congélateur (si le plat se congèle), le reste au frigo.
 */
export function platsDeLaSession(
  f: Fournee,
  recettes: readonly Recette[],
  personnes: number,
  jour: DateISO,
  identifiant: () => string,
): Plat[] {
  const parId = new Map(recettes.map((r) => [r.id, r]));
  const plats: Plat[] = [];
  for (const p of f.plats) {
    const r = parId.get(p.recetteId);
    if (!r) continue;
    const tardifs = f.repas.filter(
      (x) => x.recetteId === r.id && !x.platId && ecartJours(f.sessionLe, x.jour) > r.conservation.frigoJours,
    ).length;
    const congelees = estCongelable(r) ? Math.min(p.portions, tardifs * personnes) : 0;
    const frigo = p.portions - congelees;
    const commun = { recetteId: r.id, nom: r.nom, prepareLe: jour, fourneeId: f.id };
    if (frigo > 0)
      plats.push({
        ...commun,
        id: identifiant(),
        portions: frigo,
        lieu: 'frigo',
        limite: ajouterJours(jour, r.conservation.frigoJours),
      });
    if (congelees > 0)
      plats.push({
        ...commun,
        id: identifiant(),
        portions: congelees,
        lieu: 'congelateur',
        limite: ajouterMois(jour, r.conservation.congelateurMois ?? 3),
      });
  }
  return plats;
}
