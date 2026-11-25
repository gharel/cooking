import { reperer } from './dictionnaire';
import type { PlatDeFournee } from './fournee';
import type { Etape, Poste, Recette } from './modele';
import type { Equipement } from './reglages';
import { normaliser } from './texte';

/** Une tâche de la session : une étape d’une recette (ou plusieurs étapes identiques regroupées). */
export interface Tache {
  id: string;
  texte: string;
  /** Recettes servies (plusieurs si la tâche est regroupée). */
  recettes: string[];
  poste: Poste;
  duree: number;
  active: boolean;
  apres: string[];
  facultative: boolean;
  temperature: number | null;
  prechauffage: boolean;
}

export interface Placement {
  id: string;
  debut: number;
  fin: number;
  /** « plan 1 », « feu 2 », « four 1 », « repos » */
  voie: string;
  cuisinier: number | null;
  temperature: number | null;
}

export interface TacheVeille {
  recetteId: string;
  id: string;
  texte: string;
}

export interface Contraintes {
  /** Tâches déjà commencées ou terminées : leur placement ne bouge plus. */
  figees?: Readonly<Record<string, Placement>>;
  /** Rien de nouveau ne commence avant cet instant (minutes depuis le début). */
  apartir?: number;
}

const TEMPERATURE = /(\d{2,3})\s*°\s*c/;
const temperatureDe = (texte: string): number | null => {
  const m = TEMPERATURE.exec(normaliser(texte));
  return m ? Number(m[1]) : null;
};
const estPrechauffage = (texte: string) => /^prechauffer/.test(normaliser(texte));

/** Préparation plus longue quand on cuisine plus : ×2 portions donne ×1,5 de temps ; les cuissons ne changent pas. */
export function dureeAjustee(e: Pick<Etape, 'active' | 'poste' | 'dureeMin'>, facteur: number): number {
  if (!e.active || e.poste !== 'plan' || Math.abs(facteur - 1) < 1e-9) return e.dureeMin;
  const f = facteur > 1 ? 1 + 0.5 * (facteur - 1) : Math.max(0.6, Math.sqrt(facteur));
  return Math.max(1, Math.round(e.dureeMin * f));
}

const unique = <T>(l: T[]) => [...new Set(l)];

/**
 * Tâches de la session à partir des plats : sous-recettes développées, étapes de la veille mises à part,
 * préparations identiques de recettes différentes regroupées.
 */
export function preparerTaches(
  plats: readonly PlatDeFournee[],
  recettes: readonly Recette[],
): { taches: Tache[]; veille: TacheVeille[] } {
  const parId = new Map(recettes.map((r) => [r.id, r]));
  const taches: Tache[] = [];
  const veille: TacheVeille[] = [];

  function developper(
    r: Recette,
    facteur: number,
    prefixe: string,
    servie: string,
    racine: string[],
    sansRefroidissementFinal: boolean,
    profondeur: number,
  ): string[] {
    const reference = new Set(r.etapes.flatMap((e) => e.apres));
    const tempFour =
      r.etapes.map((e) => (e.poste === 'four' ? temperatureDe(e.texte) : null)).find((t) => t !== null) ??
      null;
    const correspondance = new Map<string, string[]>();
    for (const e of r.etapes) {
      const deps = unique(e.apres.flatMap((d) => correspondance.get(d) ?? []));
      const entree = e.apres.length === 0 ? racine : deps;
      if (e.anticiper === 'veille') {
        veille.push({ recetteId: servie, id: `${prefixe}:${e.id}`, texte: e.texte });
        correspondance.set(e.id, entree === racine ? racine : deps);
        continue;
      }
      if (sansRefroidissementFinal && e.poste === 'repos' && !reference.has(e.id)) {
        correspondance.set(e.id, entree);
        continue;
      }
      const sous = e.sousRecetteId ? parId.get(e.sousRecetteId) : undefined;
      if (e.sousRecetteId) {
        if (sous && profondeur < 3) {
          const ligne = r.ingredients.find((i) => i.recetteId === sous.id);
          const f = ((ligne?.quantite ?? sous.portions) * facteur) / sous.portions;
          correspondance.set(
            e.id,
            developper(sous, f, `${prefixe}>${sous.id}`, servie, entree, true, profondeur + 1),
          );
        } else {
          correspondance.set(e.id, entree);
        }
        continue;
      }
      const id = `${prefixe}:${e.id}`;
      taches.push({
        id,
        texte: e.texte,
        recettes: [servie],
        poste: e.poste,
        duree: dureeAjustee(e, facteur),
        active: e.active,
        apres: entree,
        facultative: e.facultative,
        temperature: e.poste === 'four' ? (temperatureDe(e.texte) ?? tempFour ?? 180) : null,
        prechauffage: e.poste === 'four' && estPrechauffage(e.texte),
      });
      correspondance.set(e.id, [id]);
    }
    return unique(
      r.etapes.filter((e) => !reference.has(e.id)).flatMap((e) => correspondance.get(e.id) ?? []),
    );
  }

  for (const p of plats) {
    const r = parId.get(p.recetteId);
    if (r) developper(r, p.portions / r.portions, r.id, r.id, [], false, 0);
  }
  return { taches: regrouper(taches), veille };
}

const GESTES = /^(emincer|hacher|eplucher|couper|rincer|ciseler|raper|peler)\b/;

/** Même geste, mêmes ingrédients, recettes différentes : une seule tâche, 75 % du temps cumulé. */
export function regrouper(taches: Tache[]): Tache[] {
  const groupes = new Map<string, Tache[]>();
  for (const t of taches) {
    if (!t.active || t.poste !== 'plan') continue;
    const n = normaliser(t.texte);
    const geste = GESTES.exec(n)?.[1];
    const cles = unique(reperer(n).map((o) => o.cle)).sort();
    if (!geste || cles.length === 0) continue;
    const cle = `${geste}|${cles.join(',')}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), t]);
  }
  const remplace = new Map<string, string>();
  const fusions = new Map<string, Tache>();
  for (const [cle, membres] of groupes) {
    if (unique(membres.map((m) => m.recettes[0])).length < 2) continue;
    const id = `regroupee:${cle}`;
    const ids = new Set(membres.map((m) => m.id));
    for (const m of membres) remplace.set(m.id, id);
    const premier = membres[0];
    if (!premier) continue;
    fusions.set(premier.id, {
      ...premier,
      id,
      recettes: unique(membres.flatMap((m) => m.recettes)),
      duree: Math.max(1, Math.round(membres.reduce((s, m) => s + m.duree, 0) * 0.75)),
      apres: unique(membres.flatMap((m) => m.apres).filter((d) => !ids.has(d))),
    });
  }
  if (remplace.size === 0) return taches;
  return taches
    .filter((t) => !remplace.has(t.id) || fusions.has(t.id))
    .map((t) => fusions.get(t.id) ?? t)
    .map((t) => ({
      ...t,
      apres: unique(t.apres.map((d) => remplace.get(d) ?? d)).filter((d) => d !== t.id),
    }));
}

const EPS = 1e-6;
const couvre = (p: Placement, t: number) => p.debut <= t + EPS && t < p.fin - EPS;

/**
 * Ordonnancement par liste avec ressources : cuisiniers (tâches actives), feux, fours (2 plats à la même
 * température ; préchauffage inutile si le four est déjà chaud), repos sans limite. À chaque instant, les
 * tâches prêtes partent par ordre de chemin restant le plus long. Fonction pure et déterministe.
 */
export function ordonnancer(
  taches: readonly Tache[],
  equipement: Equipement,
  contraintes: Contraintes = {},
): { placements: Placement[]; duree: number } {
  const cuisiniers = Math.max(1, Math.round(equipement.cuisiniers));
  const feux = Math.max(1, Math.round(equipement.feux));
  const fours = Math.max(1, Math.round(equipement.fours));
  const parId = new Map(taches.map((t) => [t.id, t]));
  const ordre = new Map(taches.map((t, i) => [t.id, i]));

  const successeurs = new Map<string, string[]>();
  for (const t of taches) for (const d of t.apres) successeurs.set(d, [...(successeurs.get(d) ?? []), t.id]);
  const memo = new Map<string, number>();
  const enCours = new Set<string>();
  const chemin = (id: string): number => {
    const connu = memo.get(id);
    if (connu !== undefined) return connu;
    if (enCours.has(id)) return 0;
    enCours.add(id);
    const v = (parId.get(id)?.duree ?? 0) + Math.max(0, ...(successeurs.get(id) ?? []).map(chemin));
    enCours.delete(id);
    memo.set(id, v);
    return v;
  };

  const placements: Placement[] = [];
  const places = new Map<string, Placement>();
  const placer = (p: Placement) => {
    placements.push(p);
    places.set(p.id, p);
  };
  for (const [id, p] of Object.entries(contraintes.figees ?? {})) if (parId.has(id)) placer({ ...p, id });

  const actifs = (t: number) => placements.filter((p) => p.fin - p.debut > EPS && couvre(p, t));

  function voieLibre(
    x: Tache,
    t: number,
  ): (Omit<Placement, 'id' | 'debut' | 'fin'> & { zero: boolean }) | null {
    const occupes = actifs(t);
    let cuisinier: number | null = null;
    if (x.active) {
      for (let k = 1; k <= cuisiniers && cuisinier === null; k++)
        if (!occupes.some((p) => p.cuisinier === k)) cuisinier = k;
      if (cuisinier === null) return null;
    }
    if (x.poste === 'feu') {
      for (let k = 1; k <= feux; k++)
        if (!occupes.some((p) => p.voie === `feu ${k}`))
          return { voie: `feu ${k}`, cuisinier, temperature: null, zero: false };
      return null;
    }
    if (x.poste === 'four') {
      const temp = x.temperature ?? 180;
      const etat = (k: number) => {
        const voie = `four ${k}`;
        const dessus = occupes.filter((p) => p.voie === voie);
        const derniere = placements
          .filter((p) => p.voie === voie && p.debut <= t + EPS)
          .sort((a, b) => a.debut - b.debut || a.fin - b.fin)
          .at(-1);
        const prechauffe = dessus.some((p) => parId.get(p.id)?.prechauffage);
        return { voie, dessus, temp: derniere?.temperature ?? null, prechauffe };
      };
      const etats = Array.from({ length: fours }, (_, i) => etat(i + 1)).sort(
        (a, b) => Number(b.temp === temp) - Number(a.temp === temp),
      );
      for (const o of etats) {
        if (x.prechauffage) {
          if (o.temp === temp && !o.prechauffe)
            return { voie: o.voie, cuisinier, temperature: temp, zero: true };
          if (o.dessus.length === 0) return { voie: o.voie, cuisinier, temperature: temp, zero: false };
        } else if (!o.prechauffe && o.dessus.length < 2 && (o.dessus.length === 0 || o.temp === temp)) {
          return { voie: o.voie, cuisinier, temperature: temp, zero: false };
        }
      }
      return null;
    }
    if (x.poste === 'plan' && x.active)
      return { voie: `plan ${cuisinier ?? 1}`, cuisinier, temperature: null, zero: false };
    return { voie: x.poste === 'repos' ? 'repos' : 'plan', cuisinier, temperature: null, zero: false };
  }

  const finDe = (id: string) => places.get(id)?.fin ?? Infinity;
  let t = contraintes.apartir ?? 0;
  let attente = taches.filter((x) => !places.has(x.id));
  for (let garde = 0; attente.length > 0 && garde < 10_000; garde++) {
    let place = true;
    while (place) {
      place = false;
      const prets = attente
        .filter((x) => x.apres.every((d) => !parId.has(d) || finDe(d) <= t + EPS))
        .sort((a, b) => chemin(b.id) - chemin(a.id) || (ordre.get(a.id) ?? 0) - (ordre.get(b.id) ?? 0));
      for (const x of prets) {
        const v = voieLibre(x, t);
        if (!v) continue;
        placer({
          id: x.id,
          debut: t,
          fin: t + (v.zero ? 0 : x.duree),
          voie: v.voie,
          cuisinier: v.cuisinier,
          temperature: v.temperature,
        });
        place = true;
      }
      attente = attente.filter((x) => !places.has(x.id));
    }
    if (attente.length === 0) break;
    const suivants = [
      ...placements.map((p) => p.fin),
      ...attente.flatMap((x) =>
        x.apres.every((d) => places.has(d) || !parId.has(d))
          ? [Math.max(0, ...x.apres.map((d) => (parId.has(d) ? finDe(d) : 0)))]
          : [],
      ),
    ].filter((v) => v > t + EPS && Number.isFinite(v));
    if (suivants.length === 0) {
      // Dépendance circulaire : on place le reste à la suite plutôt que de boucler.
      for (const x of attente) {
        placer({
          id: x.id,
          debut: t,
          fin: t + x.duree,
          voie: x.poste === 'repos' ? 'repos' : 'plan 1',
          cuisinier: x.active ? 1 : null,
          temperature: x.temperature,
        });
        t += x.duree;
      }
      break;
    }
    t = Math.min(...suivants);
  }
  return { placements, duree: Math.max(0, ...placements.map((p) => p.fin)) };
}

/** Durée en enchaînant les recettes une à une (un cuisinier, même équipement) : la référence du gain. */
export function dureeSequentielle(
  plats: readonly PlatDeFournee[],
  recettes: readonly Recette[],
  equipement: Equipement,
): number {
  return plats.reduce(
    (total, p) =>
      total + ordonnancer(preparerTaches([p], recettes).taches, { ...equipement, cuisiniers: 1 }).duree,
    0,
  );
}

export interface Planning {
  taches: Tache[];
  veille: TacheVeille[];
  placements: Placement[];
  duree: number;
  sequentielle: number;
}

export function planifier(
  plats: readonly PlatDeFournee[],
  recettes: readonly Recette[],
  equipement: Equipement,
  contraintes: Contraintes = {},
): Planning {
  const { taches, veille } = preparerTaches(plats, recettes);
  const { placements, duree } = ordonnancer(taches, equipement, contraintes);
  return { taches, veille, placements, duree, sequentielle: dureeSequentielle(plats, recettes, equipement) };
}
