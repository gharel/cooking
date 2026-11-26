import { signal } from '@preact/signals';
import { ajouterJours, aujourdhui } from '../domaine/dates';
import { DELAI_RAPPEL_JOURS, ETAT_SAUVEGARDE_VIDE, type EtatSauvegarde } from '../domaine/sauvegarde';
import { obtenirBase } from '../donnees/base';
import { exporter } from '../donnees/echange';
import { enregistrerSauvegarde, lireSauvegarde } from '../donnees/sauvegarde';
import { annoncer } from './annonces';

/** Dernière sauvegarde et report du rappel ; null tant que ce n’est pas lu (chargé avec Semaine et Recettes). */
export const etatSauvegarde = signal<EtatSauvegarde | null>(null);

let chargement: Promise<void> | null = null;
export function chargerSauvegarde(): Promise<void> {
  return (chargement ??= lireSauvegarde(obtenirBase()).then((e) => {
    etatSauvegarde.value ??= e;
  }));
}

async function ecrire(etat: EtatSauvegarde): Promise<void> {
  etatSauvegarde.value = etat;
  await enregistrerSauvegarde(obtenirBase(), etat);
}

/** Exporte toute la bibliothèque (photos comprises) dans un fichier et note la date de la sauvegarde. */
export async function telechargerExport(): Promise<void> {
  const contenu = await exporter(obtenirBase());
  const nom = `fournee-recettes-${contenu.exporteLe.slice(0, 10)}.json`;
  const url = URL.createObjectURL(new Blob([JSON.stringify(contenu, null, 2)], { type: 'application/json' }));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  lien.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  annoncer(`Export prêt : ${nom}`);
  await ecrire({ derniere: contenu.exporteLe, reporteeJusquA: null });
}

/** « Plus tard » : pas de rappel pendant quelques jours. */
export async function reporterRappel(): Promise<void> {
  await ecrire({
    ...(etatSauvegarde.value ?? ETAT_SAUVEGARDE_VIDE),
    reporteeJusquA: ajouterJours(aujourdhui(), DELAI_RAPPEL_JOURS),
  });
}
