import { describe, expect, it } from 'vitest';
import type { EtatSession } from '../../src/domaine/fournee';
import { ordonnancer, type Placement, type Tache } from '../../src/domaine/ordonnanceur';
import type { Equipement } from '../../src/domaine/reglages';
import {
  estTerminee,
  figeesEffectives,
  minutesEcoulees,
  nouvellesFigees,
  passer,
  prolonger,
  terminer,
} from '../../src/domaine/session';

const UN: Equipement = { feux: 4, fours: 1, cuisiniers: 1 };

const tache = (id: string, t: Partial<Tache> = {}): Tache => ({
  id,
  texte: id,
  recettes: ['r'],
  poste: 'plan',
  duree: 10,
  active: true,
  apres: [],
  facultative: false,
  temperature: null,
  prechauffage: false,
  ...t,
});

/** Couper (10 min, actif), mijoter (30 min, passif), servir (5 min, actif), à la suite. */
const CHAINE: Tache[] = [
  tache('couper'),
  tache('mijoter', { poste: 'feu', duree: 30, active: false, apres: ['couper'] }),
  tache('servir', { duree: 5, apres: ['mijoter'] }),
];

const session = (s: Partial<EtatSession> = {}): EtatSession => ({
  debut: 0,
  figees: {},
  faites: [],
  prevue: 45,
  sequentielle: 45,
  ...s,
});

/** Recalcul fait par l’application à l’instant m (voir planningCourant). */
const recalculer = (s: EtatSession, m: number, taches: Tache[] = CHAINE, eq: Equipement = UN) =>
  ordonnancer(taches, eq, { figees: figeesEffectives(s, taches, m), apartir: m });

/** Lance ce qui commence réellement à l’instant m, comme l’écran de session. */
function avancer(s: EtatSession, m: number, taches: Tache[] = CHAINE): EtatSession {
  const plan = recalculer(s, m, taches);
  const nouvelles = nouvellesFigees(s, { taches, placements: plan.placements }, m);
  return { ...s, figees: { ...s.figees, ...Object.fromEntries(nouvelles.map((p) => [p.id, p])) } };
}

describe('session en direct', () => {
  it('compte les minutes écoulées depuis le lancement, jamais en négatif', () => {
    expect(minutesEcoulees(session({ debut: 60_000 }), 60_000 + 90_000)).toBe(1.5);
    expect(minutesEcoulees(session({ debut: 60_000 }), 0)).toBe(0);
  });

  it('au lancement, seule la première étape commence ; la suite attend ses dépendances', () => {
    const s = avancer(session(), 0);
    expect(Object.keys(s.figees)).toEqual(['couper']);
    expect(recalculer(s, 0).duree).toBe(45);
  });

  it('une étape finie en avance avance la fin estimée et lance la suivante', () => {
    let s = avancer(session(), 0);
    s = terminer(s, 'couper', 6);
    expect(s.figees.couper).toMatchObject({ debut: 0, fin: 6 });
    expect(s.faites).toEqual(['couper']);
    expect(recalculer(s, 6).duree).toBe(41);
    s = avancer(s, 6);
    expect(s.figees.mijoter).toMatchObject({ debut: 6, fin: 36 });
  });

  it('une étape active non validée dure au moins jusqu’à maintenant : la fin estimée recule', () => {
    const s = avancer(session(), 0);
    expect(figeesEffectives(s, CHAINE, 14).couper?.fin).toBe(14);
    expect(recalculer(s, 14).duree).toBe(49);
  });

  it('une étape passive se termine toute seule à l’heure, une active seulement quand on la valide', () => {
    let s = avancer(session(), 0);
    expect(estTerminee(s, CHAINE, 'couper', 20)).toBe(false);
    s = avancer(terminer(s, 'couper', 10), 10);
    expect(estTerminee(s, CHAINE, 'mijoter', 39)).toBe(false);
    expect(estTerminee(s, CHAINE, 'mijoter', 40)).toBe(true);
    expect(s.faites).not.toContain('mijoter');
  });

  it('« Encore 5 min » prolonge une étape à partir de maintenant', () => {
    const s = avancer(session(), 0);
    expect(prolonger(s, 'couper', 3, 5).figees.couper?.fin).toBe(15);
    expect(prolonger(s, 'couper', 12, 5).figees.couper?.fin).toBe(17);
    expect(prolonger(s, 'inconnue', 3, 5)).toBe(s);
  });

  it('une étape facultative passée ne prend pas de temps', () => {
    const facultative = [tache('decorer', { facultative: true }), tache('servir', { apres: ['decorer'] })];
    const p: Placement = {
      id: 'decorer',
      debut: 0,
      fin: 10,
      voie: 'plan 1',
      cuisinier: 1,
      temperature: null,
    };
    const s = passer(session(), 'decorer', 2, p);
    expect(s.figees.decorer).toMatchObject({ debut: 2, fin: 2 });
    expect(s.faites).toEqual(['decorer']);
    expect(recalculer(s, 2, facultative).duree).toBe(12);
  });

  it('une tâche active ne commence pas tant que son cuisinier est occupé', () => {
    const deux = [tache('a'), tache('b')];
    const enCours: Placement = {
      id: 'a',
      debut: 0,
      fin: 10,
      voie: 'plan 1',
      cuisinier: 1,
      temperature: null,
    };
    const s = session({ figees: { a: enCours } });
    const prevue: Placement = { ...enCours, id: 'b', debut: 0 };
    expect(nouvellesFigees(s, { taches: deux, placements: [prevue] }, 0)).toEqual([]);
    expect(nouvellesFigees(terminer(s, 'a', 4), { taches: deux, placements: [prevue] }, 4)).toEqual([prevue]);
  });

  it('ne modifie jamais l’état reçu', () => {
    const s = avancer(session(), 0);
    const copie = structuredClone(s);
    terminer(s, 'couper', 6);
    prolonger(s, 'couper', 6, 5);
    passer(s, 'servir', 6, {
      id: 'servir',
      debut: 6,
      fin: 11,
      voie: 'plan 1',
      cuisinier: 1,
      temperature: null,
    });
    figeesEffectives(s, CHAINE, 30);
    expect(s).toEqual(copie);
  });
});
