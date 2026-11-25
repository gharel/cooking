import { describe, expect, it } from 'vitest';
import { PLACARD_PAR_DEFAUT } from '../../src/domaine/courses';
import { ajouterPlat, changerRepas, nouvelleFournee, type Fournee } from '../../src/domaine/fournee';
import { analyserIngredient } from '../../src/domaine/ingredients';
import { CATALOGUE, idees, miniSession } from '../../src/domaine/idees';
import { platsDeLaSession } from '../../src/domaine/session';
import {
  alertesStock,
  congeler,
  decongeler,
  fraicheur,
  mangerPortion,
  rappelsDecongelation,
  restesProbables,
  type Plat,
  type Reste,
} from '../../src/domaine/stock';
import { structurer } from '../../src/domaine/structuration';
import { recettesDeDepart } from '../../src/donnees/recettes-de-depart';

const recettes = recettesDeDepart();
let n = 0;
const id = () => `p${n++}`;

const plat = (extra: Partial<Plat> = {}): Plat => ({
  id: 'p',
  recetteId: 'depart-chili',
  nom: 'Chili con carne',
  portions: 4,
  lieu: 'frigo',
  prepareLe: '2026-11-29',
  limite: '2026-12-02',
  fourneeId: null,
  ...extra,
});

const reste = (ligne: string, vite = false): Reste => {
  const i = analyserIngredient(ligne);
  return {
    id: ligne,
    nom: ligne,
    cle: i.cle,
    quantite: i.quantite,
    unite: i.unite,
    vite,
    ajouteLe: '2026-12-01',
  };
};

describe('plats préparés', () => {
  it('fraîcheur : ok, bientôt, aujourd’hui, dépassé', () => {
    expect(fraicheur(plat(), '2026-11-29')).toMatchObject({ joursRestants: 3, niveau: 'ok', part: 1 });
    expect(fraicheur(plat(), '2026-12-01').niveau).toBe('bientot');
    expect(fraicheur(plat(), '2026-12-02').niveau).toBe('aujourdhui');
    expect(fraicheur(plat(), '2026-12-03').niveau).toBe('depasse');
  });

  it('manger, congeler, décongeler', () => {
    expect(mangerPortion(plat({ portions: 1 }))).toBeNull();
    expect(mangerPortion(plat())?.portions).toBe(3);
    expect(congeler(plat(), 3, '2026-11-30')).toMatchObject({ lieu: 'congelateur', limite: '2027-02-28' });
    const { reste: r, sorti } = decongeler(
      plat({ lieu: 'congelateur', limite: '2027-02-28' }),
      2,
      '2026-12-02',
      id,
    );
    expect(r).toMatchObject({ portions: 2, lieu: 'congelateur' });
    expect(sorti).toMatchObject({ portions: 2, lieu: 'frigo', limite: '2026-12-03' });
  });

  it('alertes triées : dépassé, aujourd’hui, bientôt (frigo seulement)', () => {
    const alertes = alertesStock(
      [
        plat({ id: 'a', limite: '2026-12-01' }),
        plat({ id: 'b', limite: '2026-11-30' }),
        plat({ id: 'c', limite: '2026-12-05' }),
        plat({ id: 'd', lieu: 'congelateur', limite: '2026-12-05' }),
      ],
      '2026-12-01',
    );
    expect(alertes.map((a) => [a.platId, a.niveau])).toEqual([
      ['b', 'depasse'],
      ['a', 'aujourdhui'],
    ]);
  });
});

describe('fin de session et rappels', () => {
  let f: Fournee = nouvelleFournee('f1', '2026-11-25', '2026-11-25T10:00:00.000Z');
  f = ajouterPlat(f, 'depart-gratin-dauphinois', 4);
  const jeudiMidi = f.repas.findIndex((r) => r.jour === '2026-12-03' && r.moment === 'midi');
  f = changerRepas(f, jeudiMidi, { recetteId: 'depart-gratin-dauphinois', platId: null });
  f = changerRepas(f, 0, { recetteId: 'depart-gratin-dauphinois', platId: null });

  it('range au congélateur les portions des repas tardifs', () => {
    const plats = platsDeLaSession(f, recettes, 2, '2026-11-29', id);
    expect(plats.map((p) => [p.lieu, p.portions, p.limite])).toEqual([
      ['frigo', 2, '2026-12-02'],
      ['congelateur', 2, '2027-01-29'],
    ]);
  });

  it('rappelle de sortir le plat la veille au soir', () => {
    const terminee = { ...f, statut: 'terminee' as const };
    const plats = platsDeLaSession(f, recettes, 2, '2026-11-29', id);
    const rappels = rappelsDecongelation([terminee], plats, recettes, 2, '2026-11-30');
    expect(rappels.map((r) => r.texte)).toEqual([
      'mercredi 2 décembre au soir : sortir 2 portions de Gratin dauphinois pour jeudi midi.',
    ]);
  });

  it('un repas servi par un plat du congélateur produit aussi un rappel', () => {
    const soupe = plat({ id: 'soupe', nom: 'Soupe', lieu: 'congelateur', limite: '2027-02-01' });
    const g = changerRepas(nouvelleFournee('f2', '2026-11-25', 'x'), 5, { recetteId: null, platId: 'soupe' });
    const rappels = rappelsDecongelation([g], [soupe], recettes, 2, '2026-11-30');
    expect(rappels[0]?.texte).toMatch(/au soir : sortir 2\s?portions de Soupe/);
  });

  it('restes probables : ce qu’on achète entier sans tout utiliser', () => {
    const restes = restesProbables([{ recetteId: 'depart-dahl', portions: 4 }], recettes, PLACARD_PAR_DEFAUT);
    expect(restes.map((r) => r.nom)).toEqual(['½ botte de coriandre']);
  });
});

describe('ce qu’il reste', () => {
  const frigo = [
    reste('½ courgette', true),
    reste('100 g de feta', true),
    reste('3 œufs'),
    reste('1 poivron rouge'),
    reste('½ oignon'),
    reste('2 tomates'),
  ];

  it('classe les idées, compte les ingrédients sauvés et ce qui manque, quantités comprises', () => {
    const liste = idees(frigo, recettes, PLACARD_PAR_DEFAUT);
    const frittata = liste.find((i) => i.id === 'idee-frittata');
    expect(frittata?.sauves.sort()).toEqual(['courgette', 'feta']);
    expect(frittata?.manque.sort()).toEqual(['10 cl de lait', '3 de plus (3 œufs)']);
    expect(liste[0]?.score).toBeGreaterThanOrEqual(liste[liste.length - 1]?.score ?? 0);
  });

  it('propose une mini-session sans achat quand c’est possible', () => {
    const plein = [...frigo, reste('6 œufs'), reste('10 cl de lait'), reste('1 boîte de tomates concassées')];
    const sansDoublonOeufs = plein.filter((r) => r.nom !== '3 œufs');
    const paire = miniSession(idees(sansDoublonOeufs, recettes, PLACARD_PAR_DEFAUT));
    expect(paire).not.toBeNull();
    expect(paire?.every((i) => i.manque.length === 0)).toBe(true);
  });

  it('chaque idée du catalogue devient une recette structurée', () => {
    for (const c of CATALOGUE) {
      const { etapes } = structurer(c.texte);
      expect(etapes.length, c.nom).toBeGreaterThanOrEqual(2);
      expect(c.ingredients.map((l) => analyserIngredient(l).rayon)).not.toContain('autre');
    }
  });
});
