import type { Recette } from '../domaine/modele';
import { nouvelIdentifiant, type BaseFournee, type Photo } from './base';

const CLE_DEPART = 'recettes-de-depart-installees';

/** Recettes de départ retirées : « Soupe fajitas » était en fait une soupe aux légumes et des fajitas au poulet. */
const RETIREES = ['soir-soupe-fajitas'];

/** Chargées à la demande : les données et l’analyseur ne pèsent pas sur le démarrage. */
const chargerDepart = () => import('./recettes-de-depart').then((m) => m.recettesDeDepart());

/**
 * Installe les recettes de départ au premier lancement, une seule fois. Une recette de départ supprimée
 * ensuite ne revient pas, sauf avec `manquantesSeulement` (bouton « Réinstaller les recettes de départ
 * manquantes »). Renvoie le nombre de recettes ajoutées.
 */
export async function installerRecettesDeDepart(
  base: BaseFournee,
  { manquantesSeulement = false } = {},
): Promise<number> {
  const depart = await chargerDepart();
  return base.transaction('rw', base.recettes, base.reglages, async () => {
    // Recettes de départ déjà proposées : une liste d’identifiants ; avant le lot 6, une simple date
    // voulait dire « les recettes de session ». Les nouvelles (recettes du soir) s’ajoutent une fois.
    const reglage = (await base.reglages.get(CLE_DEPART))?.valeur;
    const proposees = new Set<string>(
      Array.isArray(reglage)
        ? (reglage as string[])
        : reglage
          ? depart.filter((r) => !r.soir).map((r) => r.id)
          : [],
    );
    // Une recette retirée disparaît, sauf si l’utilisateur l’a modifiée : elle est alors à lui.
    const retirees = (await base.recettes.bulkGet(RETIREES)).filter(
      (r): r is Recette => r?.origine.type === 'depart' && r.modifieLe === r.creeLe,
    );
    await base.recettes.bulkDelete(retirees.map((r) => r.id));
    const presentes = new Set(await base.recettes.toCollection().primaryKeys());
    const aAjouter = depart.filter(
      (r) => !presentes.has(r.id) && (manquantesSeulement || !proposees.has(r.id)),
    );
    await base.recettes.bulkAdd(aAjouter);
    await base.reglages.put({ cle: CLE_DEPART, valeur: depart.map((r) => r.id) });
    return aAjouter.length;
  });
}

export async function recettesDeDepartManquantes(base: BaseFournee): Promise<number> {
  const presentes = new Set(await base.recettes.toCollection().primaryKeys());
  return (await chargerDepart()).filter((r) => !presentes.has(r.id)).length;
}

export const listerRecettes = (base: BaseFournee): Promise<Recette[]> => base.recettes.toArray();

export const lireRecette = (base: BaseFournee, id: string): Promise<Recette | undefined> =>
  base.recettes.get(id);

/** Enregistre une recette (création ou modification) ; la date de modification est mise à jour. */
export async function enregistrerRecette(base: BaseFournee, recette: Recette): Promise<Recette> {
  const aEnregistrer = { ...recette, modifieLe: new Date().toISOString() };
  await base.recettes.put(aEnregistrer);
  return aEnregistrer;
}

/** Copie indépendante : nouvel identifiant, photos dupliquées (supprimer l’une ne touche pas l’autre). */
export async function dupliquerRecette(base: BaseFournee, id: string): Promise<Recette | undefined> {
  return base.transaction('rw', base.recettes, base.photos, async () => {
    const source = await base.recettes.get(id);
    if (!source) return undefined;
    const photos = (await base.photos.bulkGet(source.photos)).filter((p): p is Photo => Boolean(p));
    const copies = photos.map((p) => ({ id: nouvelIdentifiant('photo'), blob: p.blob }));
    await base.photos.bulkAdd(copies);
    const maintenant = new Date().toISOString();
    const copie: Recette = {
      ...structuredClone(source),
      id: nouvelIdentifiant('recette'),
      nom: `${source.nom} (copie)`,
      photos: copies.map((p) => p.id),
      creeLe: maintenant,
      modifieLe: maintenant,
    };
    await base.recettes.add(copie);
    return copie;
  });
}

export interface Suppression {
  recette: Recette;
  photos: Photo[];
}

/** Supprime une recette et ses photos ; renvoie de quoi l’annuler. */
export async function supprimerRecette(base: BaseFournee, id: string): Promise<Suppression | undefined> {
  return base.transaction('rw', base.recettes, base.photos, async () => {
    const recette = await base.recettes.get(id);
    if (!recette) return undefined;
    const photos = (await base.photos.bulkGet(recette.photos)).filter((p): p is Photo => Boolean(p));
    await base.photos.bulkDelete(recette.photos);
    await base.recettes.delete(id);
    return { recette, photos };
  });
}

export async function annulerSuppression(base: BaseFournee, s: Suppression): Promise<void> {
  await base.transaction('rw', base.recettes, base.photos, async () => {
    await base.photos.bulkPut(s.photos);
    await base.recettes.put(s.recette);
  });
}

export async function enregistrerPhoto(base: BaseFournee, blob: Blob): Promise<string> {
  const id = nouvelIdentifiant('photo');
  await base.photos.add({ id, blob });
  return id;
}

export const lirePhoto = async (base: BaseFournee, id: string): Promise<Blob | undefined> =>
  (await base.photos.get(id))?.blob;

export const supprimerPhotos = (base: BaseFournee, ids: string[]): Promise<void> =>
  base.photos.bulkDelete(ids);
