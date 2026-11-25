import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  ajouterHygiene,
  APRES_CRU,
  DEPART,
  DUREE_APRES_CRU,
  dureeSequentielle,
  estDecoupeCrue,
  estTacheCommune,
  MENAGE_FIN,
  MENAGE_MILIEU,
  ordonnancer,
  planifier,
  preparerTaches,
  RANGEMENT,
  type Placement,
  type Tache,
} from '../../src/domaine/ordonnanceur';
import type { Poste } from '../../src/domaine/modele';
import type { Equipement } from '../../src/domaine/reglages';
import { recettesDeDepart } from '../../src/donnees/recettes-de-depart';

const recettes = recettesDeDepart();
const MAISON: Equipement = { feux: 4, fours: 1, cuisiniers: 1 };
const EPS = 1e-6;

/** Génère un graphe de tâches sans cycle (chaque tâche ne dépend que des précédentes). */
const arbTaches = fc
  .array(
    fc.record({
      poste: fc.constantFrom<Poste>('plan', 'feu', 'four', 'repos'),
      active: fc.boolean(),
      duree: fc.integer({ min: 1, max: 40 }),
      temperature: fc.constantFrom(180, 200),
      prechauffage: fc.boolean(),
      deps: fc.array(fc.nat(), { maxLength: 3 }),
    }),
    { minLength: 1, maxLength: 14 },
  )
  .map((brutes) =>
    brutes.map((b, i): Tache => ({
      id: `t${i}`,
      texte: `t${i}`,
      recettes: [`r${i % 3}`],
      poste: b.poste,
      duree: b.duree,
      active: b.poste === 'repos' ? false : b.poste === 'four' ? false : b.active,
      apres: i === 0 ? [] : [...new Set(b.deps.map((d) => `t${d % i}`))],
      facultative: false,
      temperature: b.poste === 'four' ? b.temperature : null,
      prechauffage: b.poste === 'four' && b.prechauffage,
    })),
  );

const arbEquipement = fc.record({
  feux: fc.integer({ min: 1, max: 4 }),
  fours: fc.integer({ min: 1, max: 2 }),
  cuisiniers: fc.integer({ min: 1, max: 2 }),
});

function verifierRessources(taches: Tache[], placements: Placement[], eq: Equipement): void {
  const parId = new Map(taches.map((t) => [t.id, t]));
  for (const p of placements) {
    const instant = p.debut;
    const presents = placements.filter(
      (q) => q.fin - q.debut > EPS && q.debut <= instant + EPS && instant < q.fin - EPS,
    );
    expect(presents.filter((q) => parId.get(q.id)?.active).length).toBeLessThanOrEqual(eq.cuisiniers);
    expect(presents.filter((q) => q.voie.startsWith('feu')).length).toBeLessThanOrEqual(eq.feux);
    for (let k = 1; k <= eq.fours; k++) {
      const dedans = presents.filter((q) => q.voie === `four ${k}`);
      expect(dedans.length).toBeLessThanOrEqual(2);
      expect(new Set(dedans.map((q) => q.temperature)).size).toBeLessThanOrEqual(1);
      if (dedans.some((q) => parId.get(q.id)?.prechauffage)) expect(dedans).toHaveLength(1);
    }
  }
}

function cheminCritique(taches: Tache[]): number {
  const memo = new Map<string, number>();
  const parId = new Map(taches.map((t) => [t.id, t]));
  const fin = (id: string): number => {
    const connu = memo.get(id);
    if (connu !== undefined) return connu;
    const t = parId.get(id);
    const v = (t?.prechauffage ? 0 : (t?.duree ?? 0)) + Math.max(0, ...(t?.apres ?? []).map(fin));
    memo.set(id, v);
    return v;
  };
  return Math.max(0, ...taches.map((t) => fin(t.id)));
}

describe('ordonnanceur : propriétés', () => {
  it('respecte dépendances et ressources, dure au moins le chemin critique, reste déterministe', () => {
    fc.assert(
      fc.property(arbTaches, arbEquipement, (taches, eq) => {
        const { placements, duree } = ordonnancer(taches, eq);
        expect(placements).toHaveLength(taches.length);
        const parId = new Map(placements.map((p) => [p.id, p]));
        for (const t of taches)
          for (const d of t.apres)
            expect(parId.get(t.id)?.debut ?? 0).toBeGreaterThanOrEqual((parId.get(d)?.fin ?? 0) - EPS);
        verifierRessources(taches, placements, eq);
        expect(duree).toBeGreaterThanOrEqual(cheminCritique(taches) - EPS);
        expect(ordonnancer(taches, eq)).toEqual({ placements, duree });
      }),
      { numRuns: 300 },
    );
  });

  it('garde les tâches figées et ne commence rien de nouveau avant « maintenant »', () => {
    fc.assert(
      fc.property(arbTaches, arbEquipement, fc.integer({ min: 0, max: 60 }), (taches, eq, maintenant) => {
        const initial = ordonnancer(taches, eq).placements;
        const figees = Object.fromEntries(initial.filter((p) => p.debut <= maintenant).map((p) => [p.id, p]));
        const { placements } = ordonnancer(taches, eq, { figees, apartir: maintenant });
        for (const p of placements) {
          const figee = figees[p.id];
          if (figee) expect(p).toEqual(figee);
          else expect(p.debut).toBeGreaterThanOrEqual(maintenant - EPS);
        }
        verifierRessources(taches, placements, eq);
      }),
      { numRuns: 200 },
    );
  });
});

describe('ordonnanceur : la fournée de démonstration', () => {
  const demo = ['depart-chili', 'depart-dahl', 'depart-gratin-dauphinois', 'depart-quiche-lorraine'].map(
    (recetteId) => ({ recetteId, portions: 4 }),
  );

  it('tient en moins de 75 % du temps de l’enchaînement recette par recette', () => {
    const planning = planifier(demo, recettes, MAISON);
    expect(planning.sequentielle).toBe(dureeSequentielle(demo, recettes, MAISON));
    expect(planning.duree).toBeLessThan(planning.sequentielle * 0.75);
  });

  it('gratin dauphinois et quiche sans pâte partagent le four à 180 °C ; le second préchauffage est inutile', () => {
    const plats = ['depart-gratin-dauphinois', 'depart-quiche-sans-pate'].map((recetteId) => ({
      recetteId,
      portions: 4,
    }));
    const { taches, placements } = planifier(plats, recettes, MAISON);
    const prechauffages = taches
      .filter((t) => t.prechauffage)
      .map((t) => placements.find((p) => p.id === t.id));
    expect(prechauffages.map((p) => (p ? p.fin - p.debut : -1)).sort()).toEqual([0, 15]);
    const cuissons = placements.filter((p) => p.voie === 'four 1' && p.fin - p.debut > 15);
    const [a, b] = cuissons;
    expect(a && b && a.debut < b.fin && b.debut < a.fin).toBe(true);
  });

  it('la lasagne développe la bolognaise avant le montage, sans son refroidissement', () => {
    const { taches, placements } = planifier(
      [{ recetteId: 'depart-lasagne', portions: 4 }],
      recettes,
      MAISON,
    );
    const bolo = taches.filter((t) => t.id.includes('>depart-bolognaise'));
    expect(bolo.map((t) => t.texte)).not.toContain('Laisser refroidir avant de portionner');
    expect(bolo.length).toBe(4);
    const montage = taches.find((t) => t.texte.startsWith('Monter'));
    const finBolo = Math.max(...bolo.map((t) => placements.find((p) => p.id === t.id)?.fin ?? 0));
    expect(placements.find((p) => p.id === montage?.id)?.debut).toBeGreaterThanOrEqual(finBolo);
  });

  it('met de côté ce qui se fait la veille', () => {
    const { veille, taches } = preparerTaches([{ recetteId: 'depart-brandade', portions: 4 }], recettes);
    expect(veille.map((v) => v.texte)).toEqual([expect.stringMatching(/^Dessaler la morue/)]);
    expect(taches.some((t) => t.texte.startsWith('Dessaler'))).toBe(false);
  });

  it('regroupe les préparations identiques de recettes différentes', () => {
    const { taches } = preparerTaches(
      [
        { recetteId: 'depart-dahl', portions: 4 },
        { recetteId: 'depart-gratin-aubergines', portions: 4 },
        { recetteId: 'depart-tian-corse', portions: 4 },
      ],
      recettes,
    );
    const regroupee = taches.find((t) => t.id.startsWith('regroupee:'));
    expect(regroupee?.recettes).toEqual(['depart-gratin-aubergines', 'depart-tian-corse']);
    expect(regroupee?.duree).toBe(6);
  });

  it('allonge la préparation quand on double les portions, pas les cuissons', () => {
    const quatre = preparerTaches([{ recetteId: 'depart-chili', portions: 4 }], recettes).taches;
    const huit = preparerTaches([{ recetteId: 'depart-chili', portions: 8 }], recettes).taches;
    expect(huit[0]?.duree).toBe(Math.round((quatre[0]?.duree ?? 0) * 1.5));
    expect(huit.find((t) => t.texte.includes('mijoter'))?.duree).toBe(
      quatre.find((t) => t.texte.includes('mijoter'))?.duree,
    );
  });
});

describe('hygiène, ménage et session à plusieurs', () => {
  const fajitas = [{ recetteId: 'soir-fajitas-poulet', portions: 4 }];
  const debutDe = (pl: readonly Placement[], id: string) => pl.find((p) => p.id === id)?.debut ?? NaN;
  const finDe = (pl: readonly Placement[], id: string) => pl.find((p) => p.id === id)?.fin ?? NaN;

  it('fajitas au poulet : légumes avant le poulet cru, puis planche et mains lavées par la même personne', () => {
    for (const cuisiniers of [1, 2]) {
      const p = planifier(fajitas, recettes, { ...MAISON, cuisiniers });
      const legumes = p.taches.filter((t) => /^(Émincer les oignons|Couper l’avocat)/.test(t.texte));
      const poulet = p.taches.find((t) => t.texte.startsWith('Couper le poulet'));
      expect(legumes).toHaveLength(2);
      expect(poulet).toBeTruthy();
      if (!poulet) return;
      expect(estDecoupeCrue(poulet)).toBe(true);
      expect(legumes.some(estDecoupeCrue)).toBe(false);
      expect(poulet.texte).toBe(
        `Couper le poulet en lanières, l’enrober des épices et d’un filet d’huile, ${APRES_CRU}`,
      );
      expect(poulet.duree).toBeGreaterThanOrEqual(5 + DUREE_APRES_CRU);
      for (const l of legumes)
        expect(debutDe(p.placements, poulet.id)).toBeGreaterThanOrEqual(finDe(p.placements, l.id) - EPS);
    }
  });

  it('commence par le lavage des mains, finit par le rangement, compte vaisselle et nettoyage', () => {
    const avec = planifier(fajitas, recettes, MAISON, {}, { hygiene: true, laveVaisselle: true });
    const sans = planifier(fajitas, recettes, MAISON, {}, { hygiene: true, laveVaisselle: false });
    for (const p of [avec, sans]) {
      expect(debutDe(p.placements, DEPART)).toBe(0);
      for (const t of p.taches)
        if (t.id !== DEPART && !t.prechauffage)
          expect(debutDe(p.placements, t.id)).toBeGreaterThanOrEqual(3 - EPS);
      expect(finDe(p.placements, RANGEMENT)).toBe(p.duree);
    }
    const duree = (p: typeof avec, id: string) => p.taches.find((t) => t.id === id)?.duree;
    expect([duree(avec, MENAGE_MILIEU), duree(avec, MENAGE_FIN)]).toEqual([5, 12]);
    expect([duree(sans, MENAGE_MILIEU), duree(sans, MENAGE_FIN)]).toEqual([15, 25]);
    expect(avec.taches.find((t) => t.id === MENAGE_MILIEU)?.texte).toMatch(/lave-vaisselle/);
    expect(sans.taches.find((t) => t.id === MENAGE_FIN)?.texte).toMatch(/Finir la vaisselle/);
    expect(sans.duree).toBeGreaterThan(avec.duree);
    const brut = planifier(fajitas, recettes, MAISON, {}, { hygiene: false, laveVaisselle: true });
    expect(brut.taches.some((t) => estTacheCommune(t.id))).toBe(false);
  });

  it('à deux : chaque tâche active a sa personne, personne n’en fait deux à la fois, la charge est partagée', () => {
    const demo = ['depart-chili', 'depart-gratin-dauphinois', 'soir-fajitas-poulet'].map((recetteId) => ({
      recetteId,
      portions: 4,
    }));
    const eq = { ...MAISON, cuisiniers: 2 };
    const p = planifier(demo, recettes, eq);
    const parId = new Map(p.taches.map((t) => [t.id, t]));
    const actives = p.placements.filter((x) => parId.get(x.id)?.active && x.fin - x.debut > EPS);
    for (const x of actives) expect([1, 2]).toContain(x.cuisinier);
    for (const a of actives)
      for (const b of actives)
        if (a !== b && a.cuisinier === b.cuisinier)
          expect(a.fin <= b.debut + EPS || b.fin <= a.debut + EPS).toBe(true);
    const travail = (k: number) =>
      actives.filter((x) => x.cuisinier === k).reduce((s, x) => s + x.fin - x.debut, 0);
    expect(Math.min(travail(1), travail(2))).toBeGreaterThan(0.6 * Math.max(travail(1), travail(2)));
    expect(p.duree).toBeLessThan(planifier(demo, recettes, MAISON).duree);
  });

  it('propriétés de l’ordonnanceur toujours vraies avec l’hygiène et le ménage', () => {
    fc.assert(
      fc.property(arbTaches, arbEquipement, fc.boolean(), (brutes, eq, lv) => {
        const taches = ajouterHygiene(brutes, 3, lv);
        const { placements, duree } = ordonnancer(taches, eq);
        expect(placements).toHaveLength(taches.length);
        const parId = new Map(placements.map((p) => [p.id, p]));
        for (const t of taches)
          for (const d of t.apres)
            expect(parId.get(t.id)?.debut ?? 0).toBeGreaterThanOrEqual((parId.get(d)?.fin ?? 0) - EPS);
        verifierRessources(taches, placements, eq);
        expect(duree).toBeGreaterThanOrEqual(cheminCritique(taches) - EPS);
        expect(parId.get(RANGEMENT)?.fin).toBe(duree);
      }),
      { numRuns: 200 },
    );
  });
});
