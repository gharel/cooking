import { describe, expect, it } from 'vitest';
import { dureeActive, dureeTotale } from '../../src/domaine/durees';
import type { Etape, Poste } from '../../src/domaine/modele';

const etape = (
  id: string,
  poste: Poste,
  active: boolean,
  dureeMin: number,
  apres: string[] = [],
  extra: Partial<Etape> = {},
): Etape => ({
  id,
  texte: id,
  poste,
  dureeMin,
  active,
  apres,
  facultative: false,
  anticiper: null,
  devinee: false,
  sousRecetteId: null,
  ...extra,
});

describe('durées', () => {
  it('un seul cuisinier : deux préparations indépendantes s’enchaînent', () => {
    const r = { etapes: [etape('a', 'plan', true, 10), etape('b', 'plan', true, 5)] };
    expect(dureeActive(r)).toBe(15);
    expect(dureeTotale(r)).toBe(15);
  });

  it('une cuisson passive avance pendant que le cuisinier prépare la suite', () => {
    const r = {
      etapes: [
        etape('four', 'four', false, 15),
        etape('couper', 'plan', true, 10),
        etape('cuire', 'four', false, 30, ['four', 'couper']),
      ],
    };
    expect(dureeTotale(r)).toBe(45);
  });

  it('le refroidissement final, la veille, les étapes facultatives et les sous-recettes ne comptent pas', () => {
    const r = {
      etapes: [
        etape('dessaler', 'repos', false, 1440, [], { anticiper: 'veille' }),
        etape('sauce', 'feu', true, 60, [], { sousRecetteId: 'bolognaise' }),
        etape('pocher', 'feu', false, 10, ['dessaler']),
        etape('ecraser', 'plan', true, 8, ['pocher', 'sauce']),
        etape('gratiner', 'four', false, 15, ['ecraser'], { facultative: true }),
        etape('refroidir', 'repos', false, 30, ['gratiner']),
      ],
    };
    expect(dureeTotale(r)).toBe(18);
    expect(dureeActive(r)).toBe(8);
  });

  it('un repos qui précède une autre étape compte (riz refroidi avant de le faire sauter)', () => {
    const r = {
      etapes: [
        etape('cuire', 'feu', false, 12),
        etape('refroidir', 'repos', false, 30, ['cuire']),
        etape('sauter', 'feu', true, 8, ['refroidir']),
      ],
    };
    expect(dureeTotale(r)).toBe(50);
  });
});
