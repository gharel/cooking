import { PLACARD_PAR_DEFAUT } from './courses';
import type { ChoixDuSoir } from './soir';

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
  /** Prénoms des personnes qui cuisinent ensemble (au moins une). */
  participants: string[];
  laveVaisselle: boolean;
  /** Heure du dîner (« 19:30 ») : widget, notification, agenda. */
  heureDiner: string;
  notificationDiner: boolean;
  /** Choix de dernière minute pour le dîner (roulette, adresse), valable le jour dit. */
  choixDuSoir: ChoixDuSoir | null;
}

export const REGLAGES_PAR_DEFAUT: Reglages = {
  personnes: 2,
  placard: [...PLACARD_PAR_DEFAUT],
  equipement: { feux: 4, fours: 1, cuisiniers: 1 },
  participants: ['Moi'],
  laveVaisselle: true,
  heureDiner: '19:30',
  notificationDiner: false,
  choixDuSoir: null,
};

/** Complète des réglages lus (anciens ou partiels) avec les valeurs par défaut. */
export function completerReglages(lus: Partial<Reglages> | undefined): Reglages {
  return {
    personnes: lus?.personnes ?? REGLAGES_PAR_DEFAUT.personnes,
    placard: lus?.placard ?? [...REGLAGES_PAR_DEFAUT.placard],
    equipement: { ...REGLAGES_PAR_DEFAUT.equipement, ...lus?.equipement },
    // Avant la v1.1, seul le nombre de cuisiniers était connu : autant de personnes à nommer.
    participants: lus?.participants?.length
      ? lus.participants
      : Array.from({ length: Math.max(1, lus?.equipement?.cuisiniers ?? 1) }, (_, i) =>
          i === 0 ? 'Moi' : `Personne ${i + 1}`,
        ),
    laveVaisselle: lus?.laveVaisselle ?? REGLAGES_PAR_DEFAUT.laveVaisselle,
    heureDiner: lus?.heureDiner ?? REGLAGES_PAR_DEFAUT.heureDiner,
    notificationDiner: lus?.notificationDiner ?? REGLAGES_PAR_DEFAUT.notificationDiner,
    choixDuSoir: lus?.choixDuSoir ?? null,
  };
}

/** L’équipement vu par l’ordonnanceur : autant de cuisiniers que de participants. */
export const equipementDeSession = (r: Reglages): Equipement => ({
  ...r.equipement,
  cuisiniers: Math.max(1, r.participants.length),
});
