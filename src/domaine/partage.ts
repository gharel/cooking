import { dateLongue, nomDuJour } from './dates';
import type { Fournee } from './fournee';
import type { Recette } from './modele';
import type { Plat } from './stock';
import { formaterDuree } from './texte';

export interface Statistiques {
  sessions: number;
  tempsGagne: number;
  plats: number;
  portions: number;
  dureeMoyenne: number;
}

/** Bilan des sessions terminées : temps gagné = enchaînement recette par recette moins durée réelle. */
export function statistiques(fournees: readonly Fournee[]): Statistiques {
  const bilans = fournees.flatMap((f) => (f.statut === 'terminee' && f.bilan ? [f.bilan] : []));
  const n = bilans.length;
  return {
    sessions: n,
    tempsGagne: bilans.reduce((t, b) => t + Math.max(0, b.dureeSequentielle - b.dureeReelle), 0),
    plats: bilans.reduce((t, b) => t + b.plats, 0),
    portions: bilans.reduce((t, b) => t + b.portions, 0),
    dureeMoyenne: n ? Math.round(bilans.reduce((t, b) => t + b.dureeReelle, 0) / n) : 0,
  };
}

/** La fournée en texte : plats, portions, repas de la semaine. */
export function texteDeLaFournee(
  f: Fournee,
  recettes: readonly Recette[],
  plats: readonly Plat[],
  heure: string,
): string {
  const nom = (id: string | null) => recettes.find((r) => r.id === id)?.nom ?? '';
  const lignes = [
    `Fournée du ${dateLongue(f.sessionLe)} à ${heure}`,
    '',
    'Plats :',
    ...f.plats.map((p) => `- ${nom(p.recetteId)} (${p.portions} portions)`),
  ];
  const repas = f.repas.filter((r) => r.recetteId || r.platId);
  if (repas.length) {
    lignes.push('', 'Repas :');
    for (const r of repas) {
      const plat = r.platId ? plats.find((p) => p.id === r.platId) : undefined;
      lignes.push(`- ${nomDuJour(r.jour)} ${r.moment} : ${plat ? `${plat.nom} (stock)` : nom(r.recetteId)}`);
    }
  }
  return lignes.join('\n');
}

export const libelleTempsGagne = (s: Statistiques): string => formaterDuree(s.tempsGagne);
