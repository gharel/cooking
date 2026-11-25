import { PLACARD_PAR_DEFAUT } from './courses';

export interface Equipement {
  feux: number;
  fours: number;
  cuisiniers: number;
}

export interface Reglages {
  /** Personnes du foyer : un repas consomme une portion par personne. */
  personnes: number;
  /** Clés des ingrédients supposés au placard. */
  placard: string[];
  equipement: Equipement;
}

export const REGLAGES_PAR_DEFAUT: Reglages = {
  personnes: 2,
  placard: [...PLACARD_PAR_DEFAUT],
  equipement: { feux: 4, fours: 1, cuisiniers: 1 },
};

/** Complète des réglages lus (anciens ou partiels) avec les valeurs par défaut. */
export function completerReglages(lus: Partial<Reglages> | undefined): Reglages {
  return {
    personnes: lus?.personnes ?? REGLAGES_PAR_DEFAUT.personnes,
    placard: lus?.placard ?? [...REGLAGES_PAR_DEFAUT.placard],
    equipement: { ...REGLAGES_PAR_DEFAUT.equipement, ...lus?.equipement },
  };
}
