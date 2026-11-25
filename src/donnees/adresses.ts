import { ADRESSES_DE_DEPART, type Adresse } from '../domaine/soir';
import type { BaseFournee } from './base';

const CLE_DEPART = 'adresses-de-depart';

/** Installe les adresses de départ une seule fois : une adresse supprimée ne revient pas. */
export async function installerAdressesDeDepart(base: BaseFournee): Promise<void> {
  await base.transaction('rw', base.adresses, base.reglages, async () => {
    if (await base.reglages.get(CLE_DEPART)) return;
    await base.adresses.bulkPut(ADRESSES_DE_DEPART.map((a) => ({ ...a })));
    await base.reglages.put({ cle: CLE_DEPART, valeur: true });
  });
}

export const lireAdresses = async (base: BaseFournee): Promise<Adresse[]> =>
  (await base.adresses.toArray()).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));

export async function enregistrerAdresse(base: BaseFournee, adresse: Adresse): Promise<void> {
  await base.adresses.put({ ...adresse, nom: adresse.nom.trim() });
}

export async function supprimerAdresse(base: BaseFournee, id: string): Promise<void> {
  await base.adresses.delete(id);
}
