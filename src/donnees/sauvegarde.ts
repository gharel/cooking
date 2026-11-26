import { ETAT_SAUVEGARDE_VIDE, type EtatSauvegarde } from '../domaine/sauvegarde';
import type { BaseFournee } from './base';

const CLE = 'sauvegarde';

const chaineOuNull = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/** État de la sauvegarde ; une valeur illisible vaut « jamais sauvegardé ». */
export async function lireSauvegarde(base: BaseFournee): Promise<EtatSauvegarde> {
  const valeur = (await base.reglages.get(CLE))?.valeur;
  if (!valeur || typeof valeur !== 'object') return { ...ETAT_SAUVEGARDE_VIDE };
  const lu = valeur as Record<string, unknown>;
  return { derniere: chaineOuNull(lu.derniere), reporteeJusquA: chaineOuNull(lu.reporteeJusquA) };
}

export async function enregistrerSauvegarde(base: BaseFournee, etat: EtatSauvegarde): Promise<void> {
  await base.reglages.put({ cle: CLE, valeur: etat });
}
