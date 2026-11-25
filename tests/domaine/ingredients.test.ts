import { describe, expect, it } from 'vitest';
import { analyserIngredient } from '../../src/domaine/ingredients';

describe('analyserIngredient', () => {
  it.each([
    ['250 g de lentilles corail', 250, 'g', 'lentilles corail', 'lentilles-corail', 'epicerie'],
    ['2 gousses d’ail', 2, 'gousse', 'ail', 'ail', 'fruits-legumes'],
    ['1 c. à s. de curry', 1, 'c. à s.', 'curry', 'curry', 'epicerie'],
    ['½ c. à c. de muscade', 0.5, 'c. à c.', 'muscade', 'muscade', 'epicerie'],
    ['½ botte de coriandre', 0.5, 'botte', 'coriandre', 'coriandre', 'fruits-legumes'],
    ['1,5 kg de pommes de terre', 1.5, 'kg', 'pommes de terre', 'pomme-de-terre', 'fruits-legumes'],
    ['3 œufs', 3, null, 'œufs', 'oeuf', 'cremerie'],
    ['500 g de bœuf haché', 500, 'g', 'bœuf haché', 'boeuf-hache', 'boucherie'],
    ['2 c. à s. d’huile d’olive', 2, 'c. à s.', 'huile d’olive', 'huile-olive', 'epicerie'],
    ['40 cl de lait de coco', 40, 'cl', 'lait de coco', 'lait-de-coco', 'epicerie'],
    ['12 feuilles de lasagne', 12, 'feuille', 'lasagne', 'feuilles-lasagne', 'epicerie'],
    ['1 feuille de laurier', 1, 'feuille', 'laurier', 'laurier', 'epicerie'],
    ['1 pincée de muscade', 1, 'pincée', 'muscade', 'muscade', 'epicerie'],
    ['1 grosse aubergine', 1, null, 'grosse aubergine', 'aubergine', 'fruits-legumes'],
    ['150 g de petits pois surgelés', 150, 'g', 'petits pois surgelés', 'petits-pois', 'surgeles'],
    ['Coriandre fraîche', null, null, 'Coriandre fraîche', 'coriandre', 'fruits-legumes'],
  ] as const)('« %s »', (ligne, quantite, unite, nom, cle, rayon) => {
    expect(analyserIngredient(ligne)).toMatchObject({ texte: ligne, quantite, unite, nom, cle, rayon });
  });

  it('lit la précision entre parenthèses', () => {
    expect(analyserIngredient('1 boîte de tomates concassées (400 g)')).toMatchObject({
      quantite: 1,
      unite: 'boîte',
      nom: 'tomates concassées',
      precision: '400 g',
      cle: 'tomates-concassees',
      facultatif: false,
    });
  });

  it('reconnaît un ingrédient facultatif', () => {
    expect(analyserIngredient('10 cl de vin rouge (facultatif)')).toMatchObject({
      nom: 'vin rouge',
      facultatif: true,
      precision: null,
    });
  });

  it('range un ingrédient inconnu dans « autre », avec une clé lisible', () => {
    expect(analyserIngredient('2 bulbes de Fenouil sauvage')).toMatchObject({
      quantite: 2,
      cle: 'bulbes-de-fenouil-sauvage',
      rayon: 'autre',
    });
  });

  it('distingue les formes proches : crème fraîche, crème liquide, pommes, pommes de terre', () => {
    expect(analyserIngredient('10 cl de crème fraîche').cle).toBe('creme-fraiche');
    expect(analyserIngredient('20 cl de crème liquide').cle).toBe('creme-liquide');
    expect(analyserIngredient('3 pommes').cle).toBe('pomme');
    expect(analyserIngredient('3 pommes de terre').cle).toBe('pomme-de-terre');
  });
});
