import type { OptionsSession, Placement } from './ordonnanceur';
import { ajouterJours, dateLongue, ecartJours, nomDuJour, prochainDimanche, type DateISO } from './dates';
import { estCongelable, type Recette } from './modele';

export type Moment = 'midi' | 'soir';

export interface Repas {
  jour: DateISO;
  moment: Moment;
  recetteId: string | null;
  /** Plat déjà au frigo ou au congélateur (lot 4). */
  platId: string | null;
  /** Repas pris à l’extérieur (resto, invitation) : rien à prévoir. Absent = à la maison (lot 7). */
  dehors?: boolean;
}

export interface PlatDeFournee {
  recetteId: string;
  portions: number;
}

/** Tâche de la session déjà commencée ou terminée : minutes depuis le début de la session. */
export interface EtatSession {
  /** Horodatage (ms) du lancement. */
  debut: number;
  figees: Record<string, Placement>;
  /** Tâches terminées (identifiants). */
  faites: string[];
  /** Durée prévue au lancement (minutes). */
  prevue: number;
  /** Durée en enchaînant les recettes une à une (minutes). */
  sequentielle: number;
  /** Hygiène et ménage au lancement ; absent pour une session lancée avant la v1.1 (sans hygiène). */
  options?: OptionsSession;
}

export interface Bilan {
  termineeLe: string;
  dureePrevue: number;
  dureeReelle: number;
  dureeSequentielle: number;
  plats: number;
  portions: number;
}

export interface Fournee {
  id: string;
  statut: 'preparation' | 'session' | 'terminee';
  sessionLe: DateISO;
  heure: string;
  plats: PlatDeFournee[];
  repas: Repas[];
  /** Lignes de courses cochées (clés d’ingrédients). */
  coches: string[];
  /** Étapes « la veille » faites. */
  veilleFaite: string[];
  session: EtatSession | null;
  bilan: Bilan | null;
  creeLe: string;
  modifieLe: string;
}

export const MOMENTS: readonly Moment[] = ['midi', 'soir'];

/** Les 7 jours qui suivent la session. */
export const joursDeLaFournee = (sessionLe: DateISO): DateISO[] =>
  [1, 2, 3, 4, 5, 6, 7].map((i) => ajouterJours(sessionLe, i));

const repasVides = (sessionLe: DateISO): Repas[] =>
  joursDeLaFournee(sessionLe).flatMap((jour) =>
    MOMENTS.map((moment) => ({ jour, moment, recetteId: null, platId: null })),
  );

export function nouvelleFournee(id: string, aujourdhui: DateISO, maintenant: string): Fournee {
  const sessionLe = prochainDimanche(aujourdhui);
  return {
    id,
    statut: 'preparation',
    sessionLe,
    heure: '14:00',
    plats: [],
    repas: repasVides(sessionLe),
    coches: [],
    veilleFaite: [],
    session: null,
    bilan: null,
    creeLe: maintenant,
    modifieLe: maintenant,
  };
}

/** Change le jour de la session : les repas suivent, dans le même ordre. */
export function changerDateSession(f: Fournee, sessionLe: DateISO): Fournee {
  const nouveaux = repasVides(sessionLe);
  return { ...f, sessionLe, repas: nouveaux.map((r, i) => ({ ...r, ...pick(f.repas[i]) })) };
}
const pick = (r: Repas | undefined) =>
  r ? { recetteId: r.recetteId, platId: r.platId, dehors: r.dehors === true } : {};

export function ajouterPlat(f: Fournee, recetteId: string, portions: number): Fournee {
  const existe = f.plats.some((p) => p.recetteId === recetteId);
  return {
    ...f,
    plats: existe
      ? f.plats.map((p) => (p.recetteId === recetteId ? { ...p, portions } : p))
      : [...f.plats, { recetteId, portions }],
  };
}

export function retirerPlat(f: Fournee, recetteId: string): Fournee {
  return {
    ...f,
    plats: f.plats.filter((p) => p.recetteId !== recetteId),
    repas: f.repas.map((r) => (r.recetteId === recetteId ? { ...r, recetteId: null } : r)),
  };
}

/** Choisit un repas : un plat, une recette, « Libre » ou « À l’extérieur » (rien de prévu à la maison). */
export function changerRepas(
  f: Fournee,
  index: number,
  choix: Pick<Repas, 'recetteId' | 'platId'> & { dehors?: boolean },
): Fournee {
  const dehors = choix.dehors === true;
  const nouveau = dehors ? { recetteId: null, platId: null } : choix;
  return { ...f, repas: f.repas.map((r, i) => (i === index ? { ...r, ...nouveau, dehors } : r)) };
}

/** Tous les midis (ou tous les soirs) de la semaine à l’extérieur, ou tous de retour à la maison (libres). */
export function momentDehors(f: Fournee, moment: Moment, dehors: boolean): Fournee {
  return {
    ...f,
    repas: f.repas.map((r) =>
      r.moment !== moment
        ? r
        : dehors
          ? { ...r, recetteId: null, platId: null, dehors: true }
          : { ...r, dehors: false },
    ),
  };
}

/** Le moment est-il à la maison cette semaine ? Oui tant qu’un de ses repas l’est. */
export const momentALaMaison = (f: Fournee, moment: Moment): boolean =>
  f.repas.some((r) => r.moment === moment && !r.dehors);

export const repasCouverts = (f: Fournee): number => f.repas.filter((r) => r.recetteId || r.platId).length;
/** Repas à prévoir : ceux pris à la maison. */
export const repasALaMaison = (f: Fournee): number => f.repas.filter((r) => !r.dehors).length;
export const portionsTotales = (f: Fournee): number => f.plats.reduce((t, p) => t + p.portions, 0);

/**
 * Répartit les plats de la fournée sur les repas libres : ceux qui se gardent le moins au frigo d’abord,
 * sans dépasser leurs portions (1 repas = 1 portion par personne), en évitant deux fois le même plat
 * d’affilée. Un repas au-delà de la conservation au frigo ne reçoit qu’un plat congelable. Un repas à
 * l’extérieur ne reçoit rien.
 */
export function repartir(f: Fournee, recettes: readonly Recette[], personnes: number): Fournee {
  const parId = new Map(recettes.map((r) => [r.id, r]));
  const restants = new Map(
    f.plats.map((p) => [p.recetteId, Math.floor(p.portions / Math.max(1, personnes))]),
  );
  const repas = f.repas.map((r) => ({ ...r, recetteId: r.platId ? r.recetteId : null }));
  let precedent: string | null = null;
  for (const r of repas) {
    if (r.platId || r.dehors) continue;
    const jourJ = ecartJours(f.sessionLe, r.jour);
    const candidats = f.plats
      .map((p) => ({ p, recette: parId.get(p.recetteId) }))
      .filter(({ p, recette }) => recette && (restants.get(p.recetteId) ?? 0) > 0)
      .filter(
        ({ recette }) => recette && (jourJ <= recette.conservation.frigoJours || estCongelable(recette)),
      )
      .sort((a, b) => {
        const fa = a.recette?.conservation.frigoJours ?? 99;
        const fb = b.recette?.conservation.frigoJours ?? 99;
        const congA = a.recette && estCongelable(a.recette) ? 1 : 0;
        const congB = b.recette && estCongelable(b.recette) ? 1 : 0;
        return (
          congA - congB || fa - fb || (restants.get(b.p.recetteId) ?? 0) - (restants.get(a.p.recetteId) ?? 0)
        );
      });
    const choix = candidats.find(({ p }) => p.recetteId !== precedent) ?? candidats[0];
    if (!choix) {
      precedent = null;
      continue;
    }
    r.recetteId = choix.p.recetteId;
    restants.set(choix.p.recetteId, (restants.get(choix.p.recetteId) ?? 0) - 1);
    precedent = choix.p.recetteId;
  }
  return { ...f, repas };
}

export type TypeAlerte = 'congeler' | 'avancer' | 'portions' | 'veille';

export interface Alerte {
  type: TypeAlerte;
  recetteId: string;
  titre: string;
  detail: string;
}

const libelleRepas = (r: Repas) => `${nomDuJour(r.jour)} ${r.moment}`;
const jours = (n: number) => `${n} jour${n > 1 ? 's' : ''}`;

/** Ce qui demande une action : conservation dépassée, portions insuffisantes, préparatifs de la veille. */
export function alertes(f: Fournee, recettes: readonly Recette[], personnes: number): Alerte[] {
  const parId = new Map(recettes.map((r) => [r.id, r]));
  const liste: Alerte[] = [];
  for (const r of f.repas) {
    const recette = r.recetteId ? parId.get(r.recetteId) : undefined;
    if (!recette || r.platId) continue;
    // Une recette du soir se cuisine le jour même : rien à conserver.
    if (recette.soir && !f.plats.some((p) => p.recetteId === recette.id)) continue;
    const jourJ = ecartJours(f.sessionLe, r.jour);
    if (jourJ <= recette.conservation.frigoJours) continue;
    if (estCongelable(recette)) {
      liste.push({
        type: 'congeler',
        recetteId: recette.id,
        titre: `${recette.nom}, ${libelleRepas(r)} : ${jourJ} jours après la session`,
        detail: `Au-delà de ${jours(recette.conservation.frigoJours)} conseillés au frigo : congelez ces ${personnes} portions le jour de la session et sortez-les ${nomDuJour(ajouterJours(r.jour, -1))} soir.`,
      });
    } else {
      liste.push({
        type: 'avancer',
        recetteId: recette.id,
        titre: `${recette.nom}, ${libelleRepas(r)} : trop tard`,
        detail: `Se garde ${jours(recette.conservation.frigoJours)} au frigo et ne se congèle pas : prévoyez-le plus tôt dans la semaine.`,
      });
    }
  }
  for (const p of f.plats) {
    const recette = parId.get(p.recetteId);
    if (!recette) continue;
    const prevus = f.repas.filter((r) => r.recetteId === p.recetteId && !r.platId).length;
    if (prevus * personnes > p.portions)
      liste.push({
        type: 'portions',
        recetteId: recette.id,
        titre: `${recette.nom} : pas assez de portions`,
        detail: `${prevus} repas prévus pour ${personnes} personnes, soit ${prevus * personnes} portions, mais ${p.portions} cuisinées.`,
      });
    for (const e of recette.etapes.filter((x) => x.anticiper === 'veille'))
      liste.push({
        type: 'veille',
        recetteId: recette.id,
        titre: `${recette.nom} : à faire la veille, ${dateLongue(ajouterJours(f.sessionLe, -1))}`,
        detail: e.texte,
      });
  }
  return liste;
}
