/** Date du calendrier, sans heure ni fuseau : « 2026-11-29 ». */
export type DateISO = string;

const deux = (n: number) => String(n).padStart(2, '0');

export function versDate(d: DateISO): Date {
  const [a, m, j] = d.split('-').map(Number);
  return new Date(a ?? 1970, (m ?? 1) - 1, j ?? 1);
}

export const versISO = (d: Date): DateISO =>
  `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
export const aujourdhui = (maintenant = new Date()): DateISO => versISO(maintenant);

export function ajouterJours(d: DateISO, n: number): DateISO {
  const x = versDate(d);
  x.setDate(x.getDate() + n);
  return versISO(x);
}

export function ajouterMois(d: DateISO, n: number): DateISO {
  const x = versDate(d);
  const jour = x.getDate();
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  const dernier = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(jour, dernier));
  return versISO(x);
}

/** Nombre de jours de a à b (positif si b est après a). */
export const ecartJours = (a: DateISO, b: DateISO): number =>
  Math.round((versDate(b).getTime() - versDate(a).getTime()) / 86_400_000);

/** 0 = dimanche … 6 = samedi. */
export const jourDeLaSemaine = (d: DateISO): number => versDate(d).getDay();

/** Le dimanche qui vient (aujourd’hui si c’est dimanche). */
export const prochainDimanche = (d: DateISO): DateISO => ajouterJours(d, (7 - jourDeLaSemaine(d)) % 7);

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const JOURS_COURTS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const numero = (j: number) => (j === 1 ? '1er' : String(j));

export const nomDuJour = (d: DateISO): string => JOURS[jourDeLaSemaine(d)] ?? '';
export const jourCourt = (d: DateISO): string => JOURS_COURTS[jourDeLaSemaine(d)] ?? '';
export const numeroDuJour = (d: DateISO): string => numero(versDate(d).getDate());

/** « dimanche 29 novembre » */
export function dateLongue(d: DateISO): string {
  const x = versDate(d);
  return `${nomDuJour(d)} ${numero(x.getDate())} ${MOIS[x.getMonth()] ?? ''}`;
}

/** « 29 novembre » */
export function dateSansJour(d: DateISO): string {
  const x = versDate(d);
  return `${numero(x.getDate())} ${MOIS[x.getMonth()] ?? ''}`;
}

/** « 29/11 » */
export function dateCourte(d: DateISO): string {
  const x = versDate(d);
  return `${deux(x.getDate())}/${deux(x.getMonth() + 1)}`;
}
