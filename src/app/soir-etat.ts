import { effect, signal } from '@preact/signals';
import { aujourdhui, ajouterJours } from '../domaine/dates';
import {
  appliquerChoix,
  calendrierDesDiners,
  delaiAvantDiner,
  dinerDuSoir,
  type Adresse,
  type ChoixDuSoir,
  type DinerDuSoir,
} from '../domaine/soir';
import {
  enregistrerAdresse,
  installerAdressesDeDepart,
  lireAdresses,
  supprimerAdresse,
} from '../donnees/adresses';
import { obtenirBase } from '../donnees/base';
import { annoncer } from './annonces';
import { recettes } from './bibliotheque-etat';
import { fournee, modifierReglages, reglages } from './fournee-etat';
import { derniereSession } from './session-etat';
import { plats } from './stock-etat';

/** Adresses du plan B, par ordre alphabétique. */
export const adresses = signal<Adresse[]>([]);

export async function demarrerAdresses(): Promise<void> {
  const base = obtenirBase();
  await installerAdressesDeDepart(base);
  adresses.value = await lireAdresses(base);
}

export async function garderAdresse(a: Adresse): Promise<void> {
  const base = obtenirBase();
  await enregistrerAdresse(base, a);
  adresses.value = await lireAdresses(base);
}

export async function oublierAdresse(id: string): Promise<void> {
  const base = obtenirBase();
  await supprimerAdresse(base, id);
  adresses.value = await lireAdresses(base);
  const choix = reglages.value.choixDuSoir;
  if (choix?.adresseId === id) await choisirPourCeSoir(null);
}

/** Fournées dont le planning compte : la courante, puis la semaine de la dernière session. */
const fourneesDuPlanning = () => [fournee.value, derniereSession.value].filter((f) => f !== null);

/** Le dîner d’un jour : choix de dernière minute, sinon le planning. */
export function dinerDu(jour = aujourdhui()): DinerDuSoir {
  return appliquerChoix(
    dinerDuSoir(fourneesDuPlanning(), recettes.value, plats.value, jour),
    reglages.value.choixDuSoir,
    recettes.value,
    adresses.value,
  );
}

/** Retient (ou oublie, avec null) le choix du dîner de ce soir. */
export async function choisirPourCeSoir(choix: Omit<ChoixDuSoir, 'jour'> | null): Promise<void> {
  await modifierReglages((r) => ({ ...r, choixDuSoir: choix && { ...choix, jour: aujourdhui() } }));
}

/** Fichier .ics des dîners à venir et des sorties du congélateur : l’agenda prévient, application fermée. */
export function telechargerAgenda(): void {
  const r = reglages.value;
  const ics = calendrierDesDiners(
    fourneesDuPlanning(),
    recettes.value,
    plats.value,
    r.personnes,
    r.heureDiner,
    aujourdhui(),
    new Date(),
  );
  if (!ics.includes('BEGIN:VEVENT')) {
    annoncer('Aucun dîner prévu à venir : remplissez d’abord les repas de la semaine.');
    return;
  }
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = 'fournee-diners.ics';
  lien.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  annoncer('Fichier d’agenda prêt : ouvrez-le pour ajouter les dîners et leurs rappels.');
}

export const notificationsPossibles = (): boolean => 'Notification' in globalThis;

/** Active le rappel du dîner : demande l’autorisation, garde le réglage. Renvoie l’autorisation obtenue. */
export async function activerRappelDiner(oui: boolean): Promise<NotificationPermission | 'indisponible'> {
  if (!oui) {
    await modifierReglages((r) => ({ ...r, notificationDiner: false }));
    return 'default';
  }
  if (!notificationsPossibles()) return 'indisponible';
  let permission = Notification.permission;
  try {
    if (permission === 'default') permission = await Notification.requestPermission();
  } catch {
    permission = 'denied';
  }
  await modifierReglages((r) => ({ ...r, notificationDiner: permission === 'granted' }));
  return permission;
}

async function notifierDiner(): Promise<void> {
  if (!notificationsPossibles() || Notification.permission !== 'granted') return;
  const d = dinerDu();
  // Dîner à l’extérieur : rien à rappeler.
  if (d.source === 'dehors') return;
  const titre = d.nom ? `Ce soir : ${d.nom}` : 'Ce soir : rien de prévu';
  const options: NotificationOptions = { body: d.conseil, tag: `diner-${d.jour}`, icon: 'pwa-192x192.png' };
  try {
    const n = new Notification(titre, options);
    n.onclick = () => {
      focus();
      location.hash = '#semaine';
      n.close();
    };
  } catch {
    // Android : seules les notifications du service worker sont permises.
    try {
      const enregistrement = await navigator.serviceWorker?.ready;
      await enregistrement?.showNotification(titre, options);
    } catch {
      // tant pis : le widget « Ce soir » reste là
    }
  }
}

let minuterie: ReturnType<typeof setTimeout> | undefined;
let dernierJourNotifie = '';

/**
 * Notification à l’heure du dîner tant que l’application est ouverte ou en arrière-plan récent (ADR 0003) ;
 * reprogrammée à chaque changement de réglage.
 */
export function demarrerRappelDiner(): () => void {
  return effect(() => {
    const { notificationDiner, heureDiner } = reglages.value;
    clearTimeout(minuterie);
    if (!notificationDiner) return;
    const programmer = () => {
      const delai = delaiAvantDiner(new Date(), heureDiner);
      // Passée l’heure, rendez-vous demain ; un délai trop long est découpé (limite des minuteries).
      const attente = delai > 0 ? delai : delai + 86_400_000;
      minuterie = setTimeout(
        () => {
          // Une seule fois par jour, et pas en retard (minuterie réveillée bien après l’heure).
          const jour = aujourdhui();
          if (Math.abs(delaiAvantDiner(new Date(), heureDiner)) < 60_000 && dernierJourNotifie !== jour) {
            dernierJourNotifie = jour;
            void notifierDiner();
          }
          programmer();
        },
        Math.min(attente, 2 ** 31 - 1),
      );
    };
    programmer();
  });
}

/** Le dîner de demain (aperçu du widget). */
export const dinerDeDemain = (): DinerDuSoir => dinerDu(ajouterJours(aujourdhui(), 1));
