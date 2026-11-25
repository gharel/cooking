import { ajouterJours, ecartJours, nomDuJour, versDate, type DateISO } from './dates';
import { dureeTotale } from './durees';
import type { Fournee, PlatDeFournee, Repas } from './fournee';
import type { Recette } from './modele';
import { rappelsDecongelation, type Plat } from './stock';
import { formaterDuree } from './texte';

/** Adresse du plan B : là où l’on aime aller chercher à manger. */
export interface Adresse {
  id: string;
  nom: string;
  type: string;
  adresse: string;
  telephone: string;
  lien: string;
}

export const ADRESSES_DE_DEPART: readonly Adresse[] = [
  { id: 'adresse-burger-king', nom: 'Burger King', type: 'Burgers', adresse: '', telephone: '', lien: '' },
  { id: 'adresse-gino-pizza', nom: 'Gino Pizza', type: 'Pizzas', adresse: '', telephone: '', lien: '' },
  { id: 'adresse-indi-kitch', nom: 'Indi Kitch', type: 'Indien', adresse: '', telephone: '', lien: '' },
];

export const lienItineraire = (a: Adresse): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.adresse.trim() || a.nom)}`;

export const lienTelephone = (a: Adresse): string => `tel:${a.telephone.replace(/[^\d+]/g, '')}`;

/** Tirage uniforme ; le hasard est injecté pour pouvoir tester. */
export function tirer<T>(options: readonly T[], aleatoire: () => number): T | null {
  if (options.length === 0) return null;
  const i = Math.min(options.length - 1, Math.floor(aleatoire() * options.length));
  return options[i] ?? null;
}

/** Hasard du navigateur (cryptographique, uniforme) entre 0 et 1. */
export function hasard(): number {
  const tableau = new Uint32Array(1);
  globalThis.crypto.getRandomValues(tableau);
  return (tableau[0] ?? 0) / 2 ** 32;
}

export type SourceDiner = 'plat' | 'fournee' | 'soir' | 'adresse' | 'libre';

export interface DinerDuSoir {
  jour: DateISO;
  source: SourceDiner;
  nom: string | null;
  recetteId: string | null;
  adresseId: string | null;
  conseil: string;
  /** Repas du planning concerné (pour y inscrire un choix de dernière minute). */
  fourneeId: string | null;
  indexRepas: number | null;
}

/** Le dîner prévu ce soir : planning de la fournée en cours, sinon celui de la semaine de la dernière session. */
export function dinerDuSoir(
  fournees: readonly Fournee[],
  recettes: readonly Recette[],
  plats: readonly Plat[],
  jour: DateISO,
): DinerDuSoir {
  const parId = new Map(recettes.map((r) => [r.id, r]));
  for (const f of fournees) {
    const index = f.repas.findIndex((r) => r.jour === jour && r.moment === 'soir');
    const repas: Repas | undefined = f.repas[index];
    if (!repas || (!repas.recetteId && !repas.platId)) continue;
    const base = { jour, fourneeId: f.id, indexRepas: index, adresseId: null };
    const plat = repas.platId ? plats.find((p) => p.id === repas.platId) : undefined;
    if (plat)
      return {
        ...base,
        source: 'plat',
        nom: plat.nom,
        recetteId: plat.recetteId,
        conseil:
          plat.lieu === 'frigo'
            ? 'Au frigo : il n’y a qu’à réchauffer.'
            : 'Au congélateur : décongelez-le au micro-ondes, ou sortez-le la veille pour la prochaine fois.',
      };
    const recette = repas.recetteId ? parId.get(repas.recetteId) : undefined;
    if (!recette) continue;
    if (recette.soir)
      return {
        ...base,
        source: 'soir',
        nom: recette.nom,
        recetteId: recette.id,
        conseil: `À cuisiner ce soir : environ ${formaterDuree(dureeTotale(recette))}.`,
      };
    const congele = plats.some(
      (p) => p.lieu === 'congelateur' && p.fourneeId === f.id && p.recetteId === recette.id,
    );
    const tardif = ecartJours(f.sessionLe, jour) > recette.conservation.frigoJours;
    return {
      ...base,
      source: 'fournee',
      nom: recette.nom,
      recetteId: recette.id,
      conseil:
        f.statut !== 'terminee'
          ? 'Prévu à la session : il sera prêt d’ici là.'
          : congele && tardif
            ? 'Congelé à la session : sorti hier soir, il n’y a qu’à réchauffer.'
            : 'Préparé à la session : au frigo, il n’y a qu’à réchauffer.',
    };
  }
  return {
    jour,
    source: 'libre',
    nom: null,
    recetteId: null,
    adresseId: null,
    conseil: 'Une recette rapide, une de nos adresses, ou la roulette pour décider ?',
    fourneeId: null,
    indexRepas: null,
  };
}

/** Choix de dernière minute pour le dîner d’un jour (roulette, adresse) : il passe avant le planning. */
export interface ChoixDuSoir {
  jour: DateISO;
  recetteId: string | null;
  adresseId: string | null;
}

export function appliquerChoix(
  diner: DinerDuSoir,
  choix: ChoixDuSoir | null,
  recettes: readonly Recette[],
  adresses: readonly Adresse[],
): DinerDuSoir {
  if (!choix || choix.jour !== diner.jour) return diner;
  const sans = { ...diner, fourneeId: null, indexRepas: null };
  const recette = choix.recetteId ? recettes.find((r) => r.id === choix.recetteId) : undefined;
  if (recette)
    return {
      ...sans,
      source: 'soir',
      nom: recette.nom,
      recetteId: recette.id,
      adresseId: null,
      conseil: `À cuisiner ce soir : environ ${formaterDuree(dureeTotale(recette))}.`,
    };
  const adresse = choix.adresseId ? adresses.find((a) => a.id === choix.adresseId) : undefined;
  if (adresse)
    return {
      ...sans,
      source: 'adresse',
      nom: adresse.nom,
      recetteId: null,
      adresseId: adresse.id,
      conseil: `Plan B${adresse.type ? ` (${adresse.type.toLowerCase()})` : ''} : ${adresse.telephone ? 'un appel pour commander, puis on va le chercher.' : 'on va le chercher.'}`,
    };
  return diner;
}

/** Recettes du soir prévues au planning : une portion par personne et par repas, pour les courses. */
export function platsDuSoir(f: Fournee, recettes: readonly Recette[], personnes: number): PlatDeFournee[] {
  const soir = new Set(recettes.filter((r) => r.soir).map((r) => r.id));
  const dansFournee = new Set(f.plats.map((p) => p.recetteId));
  const totaux = new Map<string, number>();
  for (const r of f.repas)
    if (r.recetteId && !r.platId && soir.has(r.recetteId) && !dansFournee.has(r.recetteId))
      totaux.set(r.recetteId, (totaux.get(r.recetteId) ?? 0) + personnes);
  return [...totaux.entries()].map(([recetteId, portions]) => ({ recetteId, portions }));
}

const deux = (n: number) => String(n).padStart(2, '0');
const horodatage = (jour: DateISO, heure: string) => {
  const [h, m] = heure.split(':').map(Number);
  return `${jour.replaceAll('-', '')}T${deux(h ?? 19)}${deux(m ?? 30)}00`;
};
const echapperIcs = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

function evenement(
  uid: string,
  jour: DateISO,
  heure: string,
  titre: string,
  detail: string,
  tampon: string,
): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@fournee`,
    `DTSTAMP:${tampon}`,
    `DTSTART:${horodatage(jour, heure)}`,
    'DURATION:PT30M',
    `SUMMARY:${echapperIcs(titre)}`,
    `DESCRIPTION:${echapperIcs(detail)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT0M',
    `DESCRIPTION:${echapperIcs(titre)}`,
    'END:VALARM',
    'END:VEVENT',
  ];
}

/**
 * Agenda des dîners à venir et des sorties du congélateur (fichier .ics, alarme comprise) : sur iPhone,
 * c’est l’agenda qui prévient, application fermée (ADR 0003).
 */
export function calendrierDesDiners(
  fournees: readonly Fournee[],
  recettes: readonly Recette[],
  plats: readonly Plat[],
  personnes: number,
  heureDiner: string,
  aujourdhui: DateISO,
  maintenant: Date,
): string {
  const tampon = `${maintenant.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`;
  const lignes = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fournee//Dîners//FR', 'CALSCALE:GREGORIAN'];
  const vus = new Set<string>();
  for (const f of fournees)
    for (const r of f.repas) {
      if (r.moment !== 'soir' || ecartJours(aujourdhui, r.jour) < 0 || vus.has(r.jour)) continue;
      const diner = dinerDuSoir([f], recettes, plats, r.jour);
      if (diner.source === 'libre' || !diner.nom) continue;
      vus.add(r.jour);
      lignes.push(
        ...evenement(`diner-${r.jour}`, r.jour, heureDiner, `Dîner : ${diner.nom}`, diner.conseil, tampon),
      );
    }
  const [h, m] = heureDiner.split(':').map(Number);
  const veille = `${deux(Math.max(0, (h ?? 19) + 1))}:${deux(m ?? 30)}`;
  for (const rappel of rappelsDecongelation(fournees, plats, recettes, personnes, aujourdhui))
    lignes.push(
      ...evenement(
        `decongeler-${rappel.jour}-${vus.size}-${lignes.length}`,
        rappel.jour,
        veille,
        'Sortir un plat du congélateur',
        rappel.texte,
        tampon,
      ),
    );
  lignes.push('END:VCALENDAR');
  return `${lignes.join('\r\n')}\r\n`;
}

/** Millisecondes jusqu’à l’heure du dîner aujourd’hui (négatif si elle est passée). */
export function delaiAvantDiner(maintenant: Date, heureDiner: string): number {
  const [h, m] = heureDiner.split(':').map(Number);
  const cible = versDate(
    `${maintenant.getFullYear()}-${deux(maintenant.getMonth() + 1)}-${deux(maintenant.getDate())}`,
  );
  cible.setHours(h ?? 19, m ?? 30, 0, 0);
  return cible.getTime() - maintenant.getTime();
}

export const libelleJour = (jour: DateISO, aujourdhui: DateISO): string =>
  jour === aujourdhui
    ? 'Ce soir'
    : jour === ajouterJours(aujourdhui, 1)
      ? 'Demain soir'
      : `${nomDuJour(jour)} soir`;

/** Lien saisi pour une adresse : http ou https seulement (jamais javascript: ni autre schéma). */
export function normaliserLien(saisi: string): string {
  const lien = saisi.trim();
  if (!lien) return '';
  if (/^https?:\/\//i.test(lien)) return lien;
  return `https://${lien.replace(/^[a-z][a-z0-9+.-]*:\/*/i, '')}`;
}

export type FiltreRoulette = 'tout' | 'cuisiner' | 'chercher';

export interface OptionRoulette {
  type: 'recette' | 'adresse';
  id: string;
  nom: string;
  detail: string;
}

/** Ce que la roulette peut tirer : les recettes du soir, les adresses, ou les deux. */
export function optionsRoulette(
  recettes: readonly Recette[],
  adresses: readonly Adresse[],
  filtre: FiltreRoulette,
): OptionRoulette[] {
  const aCuisiner: OptionRoulette[] =
    filtre === 'chercher'
      ? []
      : recettes
          .filter((r) => r.soir)
          .map((r) => ({
            type: 'recette',
            id: r.id,
            nom: r.nom,
            detail: `Recette du soir · ${formaterDuree(dureeTotale(r))}`,
          }));
  const aChercher: OptionRoulette[] =
    filtre === 'cuisiner'
      ? []
      : adresses.map((a) => ({
          type: 'adresse',
          id: a.id,
          nom: a.nom,
          detail: a.type ? `À aller chercher · ${a.type}` : 'À aller chercher',
        }));
  return [...aCuisiner, ...aChercher];
}
