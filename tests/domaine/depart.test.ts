import { describe, expect, it } from 'vitest';
import { correspond, filtrerRecettes } from '../../src/domaine/bibliotheque';
import { dureeTotale } from '../../src/domaine/durees';
import { verifierRecette } from '../../src/domaine/validation';
import { recettesDeDepart } from '../../src/donnees/recettes-de-depart';
import { genererAnnexe } from '../outils/annexe';

const recettes = recettesDeDepart();

describe('recettes de départ', () => {
  it('sont les 13 recettes de la maison, pour 4 portions, aux identifiants uniques', () => {
    expect(recettes).toHaveLength(13);
    expect(new Set(recettes.map((r) => r.id)).size).toBe(13);
    expect(recettes.every((r) => r.portions === 4)).toBe(true);
  });

  it('sont toutes valides', () => {
    expect(recettes.flatMap((r) => verifierRecette(r, r.id))).toEqual([]);
  });

  it('ont tous leurs ingrédients reconnus, avec un rayon (sauf la sous-recette)', () => {
    const inconnus = recettes.flatMap((r) =>
      r.ingredients.filter((i) => i.rayon === 'autre' && !i.recetteId).map((i) => `${r.nom} : ${i.texte}`),
    );
    expect(inconnus).toEqual([]);
  });

  it('se terminent toutes : durée totale positive, sous-recette existante', () => {
    const ids = new Set(recettes.map((r) => r.id));
    for (const r of recettes) {
      expect(dureeTotale(r), r.nom).toBeGreaterThan(0);
      for (const e of r.etapes) if (e.sousRecetteId) expect(ids.has(e.sousRecetteId)).toBe(true);
    }
  });

  it.each([
    ['vegetarien', 4],
    ['four', 7],
    ['congelable', 12],
    ['rapide', 3],
  ] as const)('filtre %s : %i recettes', (filtre, attendu) => {
    expect(recettes.filter((r) => correspond(r, filtre)).length).toBe(attendu);
  });

  it('se retrouvent par la recherche, sans accents', () => {
    expect(filtrerRecettes(recettes, 'gratin', []).map((r) => r.nom)).toEqual([
      'Gratin d’aubergines à la feta',
      'Gratin dauphinois',
    ]);
    expect(filtrerRecettes(recettes, 'legumes', []).map((r) => r.nom)).toEqual(['Tian de légumes corse']);
  });

  it('marquent le dessalage de la morue « à anticiper la veille »', () => {
    const brandade = recettes.find((r) => r.id === 'depart-brandade');
    expect(brandade?.etapes[0]?.anticiper).toBe('veille');
  });

  it('correspondent à l’annexe de la spec (npm run annexe pour la régénérer)', async () => {
    await expect(genererAnnexe(recettes)).toMatchFileSnapshot('../../docs/specs/002-recettes-de-depart.md');
  });
});
