import { describe, expect, it } from 'vitest';
import { ECRANS, lireAncre } from '../../src/app/routage';

describe('lireAncre', () => {
  it.each(ECRANS.map((e) => e.id))('#%s ouvre son écran', (id) => {
    expect(lireAncre(`#${id}`)).toEqual({ ecran: id });
  });

  it('#reste ouvre Frigo sur « Ce qu’il reste »', () => {
    expect(lireAncre('#reste')).toEqual({ ecran: 'frigo', onglet: 'reste' });
  });

  it('#recettes/<id> ouvre la fiche de la recette', () => {
    expect(lireAncre('#recettes/depart-dahl')).toEqual({ ecran: 'recettes', recette: 'depart-dahl' });
    expect(lireAncre(`#recettes/${encodeURIComponent('recette é')}`)).toEqual({
      ecran: 'recettes',
      recette: 'recette é',
    });
  });

  it('#stock (ancien nom) ouvre Frigo sur les plats préparés', () => {
    expect(lireAncre('#stock')).toEqual({ ecran: 'frigo', onglet: 'plats' });
  });

  it.each(['', '#', '#inconnu', '#contenu'])('« %s » donne Semaine', (ancre) => {
    expect(lireAncre(ancre)).toEqual({ ecran: 'semaine' });
  });

  it('propose les cinq écrans dans l’ordre de la navigation', () => {
    expect(ECRANS.map((e) => e.id)).toEqual(['semaine', 'courses', 'session', 'frigo', 'recettes']);
  });
});
