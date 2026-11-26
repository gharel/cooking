import { signal } from '@preact/signals';
import { aujourdhui } from '../domaine/dates';
import { portionsTotales, type EtatSession, type Fournee } from '../domaine/fournee';
import type { Recette } from '../domaine/modele';
import {
  ordonnancer,
  planifier,
  tachesDeSession,
  type OptionsSession,
  type Placement,
  type Planning,
} from '../domaine/ordonnanceur';
import type { Equipement } from '../domaine/reglages';
import { figeesEffectives, minutesEcoulees, platsDeLaSession } from '../domaine/session';
import { nouvelIdentifiant, obtenirBase } from '../donnees/base';
import { demanderNotifications, garderEcranAllume, preparerSon } from './alarme';
import { fournee, modifierFournee, nouvelleFourneeCourante } from './fournee-etat';
import { ajouterAHistorique } from './historique-etat';
import { rafraichirStock } from './stock-etat';

/** Heure courante, rafraîchie chaque seconde pendant la session. */
export const horloge = signal(Date.now());
let minuterie: ReturnType<typeof setInterval> | undefined;

export function demarrerHorloge(): () => void {
  horloge.value = Date.now();
  minuterie ??= setInterval(() => (horloge.value = Date.now()), 1000);
  return () => {
    clearInterval(minuterie);
    minuterie = undefined;
  };
}

const SANS_HYGIENE: OptionsSession = { hygiene: false, laveVaisselle: false };

/**
 * Planning vu maintenant : avant la session, le plan prévu avec les options des réglages ; pendant, recalculé
 * depuis l’état réel avec les options figées au lancement.
 */
export function planningCourant(
  f: Fournee,
  recettes: readonly Recette[],
  equipement: Equipement,
  options: OptionsSession,
  maintenantMs: number,
): { planning: Omit<Planning, 'sequentielle'> & { sequentielle: number }; m: number } {
  const s = f.session;
  if (!s) return { planning: planifier(f.plats, recettes, equipement, {}, options), m: 0 };
  const m = minutesEcoulees(s, maintenantMs);
  const { taches, veille } = tachesDeSession(f.plats, recettes, s.options ?? SANS_HYGIENE);
  const { placements, duree } = ordonnancer(taches, equipement, {
    figees: figeesEffectives(s, taches, m),
    apartir: m,
  });
  return { planning: { taches, veille, placements, duree, sequentielle: s.sequentielle }, m };
}

export async function lancerSession(
  recettes: readonly Recette[],
  equipement: Equipement,
  options: OptionsSession,
): Promise<void> {
  preparerSon();
  void demanderNotifications();
  void garderEcranAllume(true);
  await modifierFournee((f) => {
    const p = planifier(f.plats, recettes, equipement, {}, options);
    return {
      ...f,
      statut: 'session',
      session: {
        debut: Date.now(),
        figees: {},
        faites: [],
        prevue: Math.round(p.duree),
        sequentielle: Math.round(p.sequentielle),
        options,
      },
    };
  });
}

export async function figer(nouvelles: Placement[]): Promise<void> {
  if (nouvelles.length === 0) return;
  await modifierFournee((f) =>
    f.session
      ? {
          ...f,
          session: {
            ...f.session,
            figees: { ...f.session.figees, ...Object.fromEntries(nouvelles.map((p) => [p.id, p])) },
          },
        }
      : f,
  );
}

/** Applique une action de session (terminer, passer, prolonger) à l’instant présent. */
export async function agir(action: (s: EtatSession, m: number) => EtatSession): Promise<void> {
  await modifierFournee((f) =>
    f.session ? { ...f, session: action(f.session, minutesEcoulees(f.session, Date.now())) } : f,
  );
}

/** Fin de session : bilan, plats rangés au frigo ou au congélateur, nouvelle fournée prête. */
export async function terminerSession(recettes: readonly Recette[], personnes: number): Promise<number> {
  const f = fournee.value;
  if (!f?.session) return 0;
  const m = minutesEcoulees(f.session, Date.now());
  const plats = platsDeLaSession(f, recettes, personnes, aujourdhui(), () => nouvelIdentifiant('plat'));
  const terminee: Fournee = {
    ...f,
    statut: 'terminee',
    modifieLe: new Date().toISOString(),
    bilan: {
      termineeLe: new Date().toISOString(),
      dureePrevue: f.session.prevue,
      dureeReelle: Math.round(m),
      dureeSequentielle: f.session.sequentielle,
      plats: f.plats.length,
      portions: portionsTotales(f),
    },
  };
  const base = obtenirBase();
  await base.transaction('rw', base.fournees, base.plats, async () => {
    await base.plats.bulkAdd(plats);
    await base.fournees.put(terminee);
  });
  void garderEcranAllume(false);
  ajouterAHistorique(terminee);
  await nouvelleFourneeCourante();
  await rafraichirStock();
  return plats.length;
}
