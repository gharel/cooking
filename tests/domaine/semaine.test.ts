import { describe, expect, it } from 'vitest';
import { listeDeCourses, texteDesCourses, PLACARD_PAR_DEFAUT } from '../../src/domaine/courses';
import { ajouterJours, ajouterMois, dateLongue, ecartJours, prochainDimanche } from '../../src/domaine/dates';
import {
  ajouterPlat,
  alertes,
  changerDateSession,
  changerRepas,
  momentALaMaison,
  momentDehors,
  nouvelleFournee,
  repartir,
  repasALaMaison,
  repasCouverts,
  retirerPlat,
  type Fournee,
} from '../../src/domaine/fournee';
import { analyserIngredient } from '../../src/domaine/ingredients';
import { arrondirQuantite, formaterQuantite, texteMisALEchelle } from '../../src/domaine/portions';
import { recettesDeDepart } from '../../src/donnees/recettes-de-depart';

const recettes = recettesDeDepart();
const fournee = () => nouvelleFournee('f1', '2026-11-25', '2026-11-25T10:00:00.000Z');

describe('dates', () => {
  it('trouve le prochain dimanche et compte les jours', () => {
    expect(prochainDimanche('2026-11-25')).toBe('2026-11-29');
    expect(prochainDimanche('2026-11-29')).toBe('2026-11-29');
    expect(ecartJours('2026-11-29', '2026-12-03')).toBe(4);
    expect(ajouterJours('2026-12-31', 1)).toBe('2027-01-01');
    expect(ajouterMois('2026-11-30', 3)).toBe('2027-02-28');
    expect(dateLongue('2026-12-01')).toBe('mardi 1er décembre');
  });
});

describe('portions', () => {
  it.each([
    [0.5, '½'],
    [1.5, '1 ½'],
    [2.25, '2 ¼'],
    [3, '3'],
    [1.2, '1,2'],
  ])('formate %s en %s', (q, attendu) => {
    expect(formaterQuantite(q)).toBe(attendu);
  });

  it('arrondit selon l’unité', () => {
    expect(arrondirQuantite(437.5, 'g', 'bœuf')).toBe(440);
    expect(arrondirQuantite(62.5, 'g', 'feta')).toBe(65);
    expect(arrondirQuantite(1.5, 'boîte', 'tomates')).toBe(2);
    expect(arrondirQuantite(1.3, null, 'oignon')).toBe(1.5);
    expect(arrondirQuantite(0.75, null, 'pâte brisée')).toBe(1);
  });

  it('met un ingrédient à l’échelle, nom et unité accordés', () => {
    expect(texteMisALEchelle(analyserIngredient('1 oignon'), 2)).toBe('2 oignons');
    expect(texteMisALEchelle(analyserIngredient('1 poivron rouge'), 2)).toBe('2 poivrons rouges');
    expect(texteMisALEchelle(analyserIngredient('2 gousses d’ail'), 1.5)).toBe('3 gousses d’ail');
    expect(texteMisALEchelle(analyserIngredient('500 g de bœuf haché'), 1.5)).toBe('750 g de bœuf haché');
    expect(texteMisALEchelle(analyserIngredient('1 boîte de tomates concassées (400 g)'), 1.5)).toBe(
      '2 boîtes de tomates concassées (400 g)',
    );
    expect(texteMisALEchelle(analyserIngredient('10 cl de vin rouge (facultatif)'), 2)).toBe(
      '20 cl de vin rouge (facultatif)',
    );
    expect(texteMisALEchelle(analyserIngredient('sel'), 2)).toBe('sel');
    expect(texteMisALEchelle(analyserIngredient('1 oignon'), 1)).toBe('1 oignon');
  });
});

describe('fournée', () => {
  it('commence le dimanche suivant, avec 14 repas libres sur les 7 jours d’après', () => {
    const f = fournee();
    expect(f.sessionLe).toBe('2026-11-29');
    expect(f.repas).toHaveLength(14);
    expect(f.repas[0]).toMatchObject({ jour: '2026-11-30', moment: 'midi', recetteId: null });
    expect(f.repas[13]).toMatchObject({ jour: '2026-12-06', moment: 'soir' });
  });

  it('un plat ajouté deux fois change de portions, retiré il libère ses repas', () => {
    let f = ajouterPlat(fournee(), 'depart-chili', 4);
    f = ajouterPlat(f, 'depart-chili', 8);
    expect(f.plats).toEqual([{ recetteId: 'depart-chili', portions: 8 }]);
    f = changerRepas(f, 0, { recetteId: 'depart-chili', platId: null });
    f = retirerPlat(f, 'depart-chili');
    expect(f.plats).toEqual([]);
    expect(f.repas[0]?.recetteId).toBeNull();
  });

  it('changer la date de session décale les repas en gardant leur ordre', () => {
    let f = changerRepas(fournee(), 0, { recetteId: 'depart-dahl', platId: null });
    f = changerDateSession(f, '2026-12-06');
    expect(f.repas[0]).toMatchObject({ jour: '2026-12-07', recetteId: 'depart-dahl' });
  });

  it('répartit 4 plats de 4 portions pour 2 personnes sur 8 repas, sans dépasser les portions', () => {
    let f = fournee();
    for (const id of ['depart-chili', 'depart-dahl', 'depart-gratin-dauphinois', 'depart-quiche-lorraine'])
      f = ajouterPlat(f, id, 4);
    f = repartir(f, recettes, 2);
    expect(repasCouverts(f)).toBe(8);
    for (const p of f.plats) expect(f.repas.filter((r) => r.recetteId === p.recetteId)).toHaveLength(2);
    const suite = f.repas.map((r) => r.recetteId).filter(Boolean);
    expect(suite.some((id, i) => id === suite[i + 1])).toBe(false);
  });

  it('ne place un plat qui ne se congèle pas qu’avant sa date limite', () => {
    let f = ajouterPlat(fournee(), 'depart-omelette-normande', 12);
    f = repartir(f, recettes, 2);
    const jours = f.repas.filter((r) => r.recetteId).map((r) => ecartJours(f.sessionLe, r.jour));
    expect(Math.max(...jours)).toBeLessThanOrEqual(2);
  });

  it('alerte : à congeler, à avancer, portions insuffisantes, à faire la veille', () => {
    let f = ajouterPlat(fournee(), 'depart-gratin-dauphinois', 4);
    f = ajouterPlat(f, 'depart-omelette-normande', 4);
    f = ajouterPlat(f, 'depart-brandade', 4);
    const jeudiMidi = f.repas.findIndex((r) => r.jour === '2026-12-03' && r.moment === 'midi');
    const jeudiSoir = jeudiMidi + 1;
    f = changerRepas(f, jeudiMidi, { recetteId: 'depart-gratin-dauphinois', platId: null });
    f = changerRepas(f, jeudiSoir, { recetteId: 'depart-omelette-normande', platId: null });
    f = changerRepas(f, 0, { recetteId: 'depart-gratin-dauphinois', platId: null });
    f = changerRepas(f, 1, { recetteId: 'depart-gratin-dauphinois', platId: null });
    const types = alertes(f, recettes, 2).map((a) => [a.type, a.recetteId]);
    expect(types).toContainEqual(['congeler', 'depart-gratin-dauphinois']);
    expect(types).toContainEqual(['avancer', 'depart-omelette-normande']);
    expect(types).toContainEqual(['portions', 'depart-gratin-dauphinois']);
    expect(types).toContainEqual(['veille', 'depart-brandade']);
    const congeler = alertes(f, recettes, 2).find((a) => a.type === 'congeler');
    expect(congeler?.detail).toMatch(/sortez-les mercredi soir/);
  });
});

describe('repas à l’extérieur', () => {
  const mardiSoir = (f: Fournee) => f.repas.findIndex((r) => r.jour === '2026-12-01' && r.moment === 'soir');

  it('un repas à l’extérieur perd son plat, sort du compte et n’est pas rempli par la répartition', () => {
    let f = ajouterPlat(fournee(), 'depart-chili', 12);
    f = changerRepas(f, mardiSoir(f), { recetteId: 'depart-chili', platId: null });
    f = changerRepas(f, mardiSoir(f), { recetteId: null, platId: null, dehors: true });
    expect(f.repas[mardiSoir(f)]).toMatchObject({ recetteId: null, platId: null, dehors: true });
    expect(repasALaMaison(f)).toBe(13);
    f = repartir(f, recettes, 1);
    expect(f.repas[mardiSoir(f)]).toMatchObject({ recetteId: null, dehors: true });
    expect(repasCouverts(f)).toBe(12);
    // Choisir un plat le remet à la maison.
    f = changerRepas(f, mardiSoir(f), { recetteId: 'depart-chili', platId: null });
    expect(f.repas[mardiSoir(f)]?.dehors).toBe(false);
    expect(repasALaMaison(f)).toBe(14);
  });

  it('tous les midis à l’extérieur, puis de retour à la maison ; la date de session les emporte', () => {
    let f = changerRepas(fournee(), 0, { recetteId: 'depart-dahl', platId: null });
    const avant = f;
    f = momentDehors(f, 'midi', true);
    expect(avant.repas[0]?.recetteId).toBe('depart-dahl');
    expect(f.repas.filter((r) => r.moment === 'midi').every((r) => r.dehors && !r.recetteId)).toBe(true);
    expect(f.repas.filter((r) => r.moment === 'soir').some((r) => r.dehors)).toBe(false);
    expect([momentALaMaison(f, 'midi'), momentALaMaison(f, 'soir')]).toEqual([false, true]);
    expect(repasALaMaison(f)).toBe(7);
    expect(changerDateSession(f, '2026-12-06').repas[0]).toMatchObject({ jour: '2026-12-07', dehors: true });
    f = momentDehors(f, 'midi', false);
    expect(repasALaMaison(f)).toBe(14);
    expect(momentALaMaison(f, 'midi')).toBe(true);
    // Un seul midi à la maison suffit pour que la case reste cochée.
    f = changerRepas(momentDehors(f, 'midi', true), 0, { recetteId: null, platId: null });
    expect(momentALaMaison(f, 'midi')).toBe(true);
  });

  it('une fournée enregistrée avant le lot 7 (sans le champ) est à la maison', () => {
    const ancienne = fournee();
    for (const r of ancienne.repas) delete r.dehors;
    expect(repasALaMaison(ancienne)).toBe(14);
    expect(momentALaMaison(ancienne, 'soir')).toBe(true);
  });
});

describe('courses', () => {
  it('8 portions de chili doublent les quantités', () => {
    const liste = listeDeCourses([{ recetteId: 'depart-chili', portions: 8 }], recettes, PLACARD_PAR_DEFAUT);
    const lignes = liste.rayons.flatMap((r) => r.lignes);
    expect(lignes.find((l) => l.cle === 'boeuf-hache')?.texte).toBe('1 kg de bœuf haché');
    expect(lignes.find((l) => l.cle === 'oignon')?.texte).toBe('2 oignons');
    expect(lignes.find((l) => l.cle === 'ail')?.texte).toBe('4 gousses d’ail');
  });

  it('chili et bolognaise : une ligne de bœuf, détaillée par recette ; la lasagne ajoute la bolognaise', () => {
    const liste = listeDeCourses(
      [
        { recetteId: 'depart-chili', portions: 4 },
        { recetteId: 'depart-bolognaise', portions: 4 },
        { recetteId: 'depart-lasagne', portions: 4 },
      ],
      recettes,
      PLACARD_PAR_DEFAUT,
    );
    const boeuf = liste.rayons.flatMap((r) => r.lignes).find((l) => l.cle === 'boeuf-hache');
    expect(boeuf?.texte).toBe('1,5 kg de bœuf haché');
    expect(boeuf?.parts.map((p) => p.recette)).toEqual([
      'Chili con carne',
      'Bolognaise',
      'Lasagne (bolognaise)',
    ]);
    const lait = liste.rayons.flatMap((r) => r.lignes).find((l) => l.cle === 'lait');
    expect(lait?.texte).toBe('50 cl de lait');
  });

  it('range par rayon et met les basiques au placard', () => {
    const liste = listeDeCourses([{ recetteId: 'depart-dahl', portions: 4 }], recettes, PLACARD_PAR_DEFAUT);
    expect(liste.rayons.map((r) => r.rayon)).toEqual(['fruits-legumes', 'epicerie']);
    expect(liste.placard.map((l) => l.cle).sort()).toEqual(['cumin', 'curcuma', 'curry', 'huile']);
    expect(liste.total).toBe(liste.rayons.flatMap((r) => r.lignes).length);
  });

  it('produit un texte à partager sans les articles cochés', () => {
    const liste = listeDeCourses([{ recetteId: 'depart-dahl', portions: 4 }], recettes, PLACARD_PAR_DEFAUT);
    const texte = texteDesCourses(liste, ['lentilles-corail']);
    expect(texte).toMatch(/^Courses Fournée/);
    expect(texte).toMatch(/- 1 oignon/);
    expect(texte).not.toMatch(/lentilles corail/);
  });
});
