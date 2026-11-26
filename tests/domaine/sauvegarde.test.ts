import { describe, expect, it } from 'vitest';
import type { Recette } from '../../src/domaine/modele';
import {
  DELAI_RAPPEL_JOURS,
  ETAT_SAUVEGARDE_VIDE,
  estASauvegarder,
  rappelSauvegarde,
} from '../../src/domaine/sauvegarde';
import { recettesDeDepart } from '../../src/donnees/recettes-de-depart';

const depart = recettesDeDepart();
const intacte = depart[0];
if (!intacte) throw new Error('Recettes de départ introuvables');
const MAINTENANT = new Date('2026-11-26T12:00:00Z');
const ilYA = (jours: number) => new Date(MAINTENANT.getTime() - jours * 86_400_000).toISOString();

const perso = (modifieLe: string, id = 'perso'): Recette => ({
  ...intacte,
  id,
  nom: 'Dahl de la maison',
  origine: { type: 'maison', de: null, mot: null, source: null },
  creeLe: modifieLe,
  modifieLe,
});

describe('recettes à sauvegarder', () => {
  it('ignore les recettes de départ intactes, compte celles qu’on a modifiées', () => {
    expect(estASauvegarder(intacte, null)).toBe(false);
    expect(estASauvegarder({ ...intacte, modifieLe: ilYA(1) }, null)).toBe(true);
    expect(estASauvegarder(perso(ilYA(30)), null)).toBe(true);
  });

  it('après une sauvegarde, seules les recettes modifiées depuis comptent', () => {
    const sauvegarde = ilYA(10);
    expect(estASauvegarder(perso(ilYA(20)), sauvegarde)).toBe(false);
    expect(estASauvegarder(perso(ilYA(5)), sauvegarde)).toBe(true);
  });
});

describe('rappel de sauvegarde', () => {
  it('rien à rappeler sans recette personnelle', () => {
    expect(rappelSauvegarde(depart, ETAT_SAUVEGARDE_VIDE, MAINTENANT)).toBeNull();
  });

  it(`attend ${DELAI_RAPPEL_JOURS} jours après la plus ancienne modification non sauvegardée`, () => {
    expect(rappelSauvegarde([...depart, perso(ilYA(6))], ETAT_SAUVEGARDE_VIDE, MAINTENANT)).toBeNull();
    expect(
      rappelSauvegarde(
        [...depart, perso(ilYA(7)), perso(ilYA(1), 'autre')],
        ETAT_SAUVEGARDE_VIDE,
        MAINTENANT,
      ),
    ).toEqual({ nombre: 2, derniere: null });
  });

  it('donne la date de la dernière sauvegarde', () => {
    const derniere = ilYA(40);
    expect(rappelSauvegarde([perso(ilYA(30))], { derniere, reporteeJusquA: null }, MAINTENANT)).toEqual({
      nombre: 1,
      derniere,
    });
  });

  it('« Plus tard » masque le rappel jusqu’au jour dit', () => {
    const recettes = [perso(ilYA(30))];
    expect(
      rappelSauvegarde(recettes, { derniere: null, reporteeJusquA: '2026-11-27' }, MAINTENANT),
    ).toBeNull();
    expect(rappelSauvegarde(recettes, { derniere: null, reporteeJusquA: '2026-11-26' }, MAINTENANT)).toEqual({
      nombre: 1,
      derniere: null,
    });
  });

  it('une date illisible ne bloque pas le rappel', () => {
    expect(rappelSauvegarde([perso('hier')], ETAT_SAUVEGARDE_VIDE, MAINTENANT)).toEqual({
      nombre: 1,
      derniere: null,
    });
  });

  it('ne modifie pas ce qu’il reçoit', () => {
    const recettes = [perso(ilYA(30))];
    const etat = { derniere: null, reporteeJusquA: null };
    const copie = structuredClone({ recettes, etat });
    rappelSauvegarde(recettes, etat, MAINTENANT);
    expect({ recettes, etat }).toEqual(copie);
  });
});
