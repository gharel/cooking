import { aujourdhui } from '../domaine/dates';
import { nouvelleFournee, type Fournee } from '../domaine/fournee';
import { completerReglages, type Reglages } from '../domaine/reglages';
import { nouvelIdentifiant, type BaseFournee } from './base';

const CLE_REGLAGES = 'reglages';

/** La fournée en cours (en préparation ou en session) ; en crée une si aucune. */
export async function fourneeCourante(base: BaseFournee, maintenant = new Date()): Promise<Fournee> {
  const enCours = (await base.fournees.toArray())
    .filter((f) => f.statut !== 'terminee')
    .sort((a, b) => b.creeLe.localeCompare(a.creeLe))[0];
  if (enCours) return enCours;
  const f = nouvelleFournee(nouvelIdentifiant('fournee'), aujourdhui(maintenant), maintenant.toISOString());
  await base.fournees.add(f);
  return f;
}

export async function enregistrerFournee(base: BaseFournee, f: Fournee): Promise<Fournee> {
  const aEnregistrer = { ...f, modifieLe: new Date().toISOString() };
  await base.fournees.put(aEnregistrer);
  return aEnregistrer;
}

export const fourneesTerminees = async (base: BaseFournee): Promise<Fournee[]> =>
  (await base.fournees.where('statut').equals('terminee').toArray()).sort((a, b) =>
    (b.bilan?.termineeLe ?? '').localeCompare(a.bilan?.termineeLe ?? ''),
  );

export async function lireReglages(base: BaseFournee): Promise<Reglages> {
  const lu = await base.reglages.get(CLE_REGLAGES);
  return completerReglages(lu?.valeur as Partial<Reglages> | undefined);
}

export async function enregistrerReglages(base: BaseFournee, r: Reglages): Promise<void> {
  await base.reglages.put({ cle: CLE_REGLAGES, valeur: r });
}
