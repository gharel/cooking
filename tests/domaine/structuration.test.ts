import { describe, expect, it } from 'vitest';
import { extraireIngredients, lireDuree, proposerEtapes, structurer } from '../../src/domaine/structuration';

// La recette de famille de la maquette, telle qu’on la raconte.
const HACHIS =
  'Cuire 1 kg de pommes de terre 25 min dans l’eau salée. Pendant ce temps, faire revenir 2 oignons puis 500 g de bœuf haché. Écraser les pommes de terre avec 20 cl de lait, 50 g de beurre et une pointe de muscade. Monter dans le plat, mettre le fromage et gratiner 20 min à 200 °C.';

describe('proposerEtapes', () => {
  const etapes = proposerEtapes(HACHIS);

  it('découpe le hachis en 5 étapes', () => {
    expect(etapes.map((e) => e.texte)).toEqual([
      'Cuire 1 kg de pommes de terre 25 min dans l’eau salée',
      'Faire revenir 2 oignons puis 500 g de bœuf haché',
      'Écraser les pommes de terre avec 20 cl de lait, 50 g de beurre et une pointe de muscade',
      'Monter dans le plat',
      'Mettre le fromage et gratiner 20 min à 200 °C',
    ]);
  });

  it('lit les durées écrites et signale les 3 durées devinées', () => {
    expect(etapes.map((e) => [e.dureeMin, e.devinee])).toEqual([
      [25, false],
      [10, true],
      [8, true],
      [5, true],
      [20, false],
    ]);
  });

  it('déduit le poste et le caractère actif du verbe', () => {
    expect(etapes.map((e) => [e.poste, e.active])).toEqual([
      ['feu', false],
      ['feu', true],
      ['plan', true],
      ['plan', true],
      ['four', false],
    ]);
  });

  it('« pendant ce temps » met deux étapes en parallèle, la suivante attend les deux', () => {
    expect(etapes[1]?.apres).toEqual([]);
    expect(etapes[2]?.apres).toEqual(['e1', 'e2']);
    expect(etapes[3]?.apres).toEqual(['e3']);
    expect(etapes[4]?.apres).toEqual(['e4']);
  });

  it('rattache « ajouter » à l’action qui suit', () => {
    const dahl = proposerEtapes(
      'Faire revenir l’oignon et l’ail 5 min. Ajouter les lentilles et le lait de coco, laisser mijoter 25 min.',
    );
    expect(dahl.map((e) => [e.texte, e.poste, e.active, e.dureeMin])).toEqual([
      ['Faire revenir l’oignon et l’ail 5 min', 'feu', true, 5],
      ['Ajouter les lentilles et le lait de coco, laisser mijoter 25 min', 'feu', false, 25],
    ]);
  });

  it('« la veille » et le dessalage : étape à anticiper', () => {
    const brandade = proposerEtapes(
      'La veille, dessaler la morue en changeant l’eau 3 fois. Cuire les pommes de terre 25 min.',
    );
    expect(brandade[0]).toMatchObject({ poste: 'repos', anticiper: 'veille', dureeMin: 1440 });
    expect(brandade[1]).toMatchObject({ poste: 'feu', anticiper: null, dureeMin: 25 });
  });

  it('ne coupe pas une phrase sur les abréviations « c. à s. »', () => {
    expect(proposerEtapes('Ajouter 1 c. à s. de curry et faire revenir 2 min.')).toHaveLength(1);
  });

  it('« cuire au four » va au four', () => {
    expect(proposerEtapes('Cuire au four 40 min.')[0]).toMatchObject({ poste: 'four', dureeMin: 40 });
  });
});

describe('lireDuree', () => {
  it.each([
    ['25 min', 25],
    ['1 h 30', 90],
    ['24 h', 1440],
    ['2 heures', 120],
    ['une demi-heure', 30],
    ['à 200 °C', null],
    ['3 haricots', null],
  ])('%s', (texte, attendu) => {
    expect(lireDuree(texte)).toBe(attendu);
  });
});

describe('extraireIngredients', () => {
  it('reconnaît les 7 ingrédients du hachis, avec leurs quantités', () => {
    const ingredients = extraireIngredients(HACHIS);
    expect(ingredients.map((i) => [i.cle, i.quantite, i.unite])).toEqual([
      ['pomme-de-terre', 1, 'kg'],
      ['oignon', 2, null],
      ['boeuf-hache', 500, 'g'],
      ['lait', 20, 'cl'],
      ['beurre', 50, 'g'],
      ['muscade', 1, 'pointe'],
      ['fromage', null, null],
    ]);
    expect(ingredients[2]?.texte).toBe('500 g de bœuf haché');
    expect(ingredients[2]?.nom).toBe('bœuf haché');
  });

  it('structurer renvoie étapes et ingrédients', () => {
    const { etapes, ingredients } = structurer(HACHIS);
    expect(etapes).toHaveLength(5);
    expect(ingredients).toHaveLength(7);
  });
});
