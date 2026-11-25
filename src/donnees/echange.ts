import { FORMAT_EXPORT, VERSION_EXPORT, lireExport, type Export } from '../domaine/validation';
import type { BaseFournee, Photo } from './base';

async function versBase64(blob: Blob): Promise<string> {
  const octets = new Uint8Array(await blob.arrayBuffer());
  let binaire = '';
  for (let i = 0; i < octets.length; i += 0x8000)
    binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

function depuisBase64(donnees: string, type: string): Blob {
  const binaire = atob(donnees);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
  return new Blob([octets], { type });
}

/** Toute la bibliothèque, photos comprises, dans un objet prêt à écrire en JSON. */
export async function exporter(base: BaseFournee): Promise<Export> {
  const recettes = await base.recettes.toArray();
  const photos = await base.photos.toArray();
  return {
    format: FORMAT_EXPORT,
    version: VERSION_EXPORT,
    exporteLe: new Date().toISOString(),
    recettes,
    photos: await Promise.all(
      photos.map(async (p) => ({
        id: p.id,
        type: p.blob.type || 'image/jpeg',
        donnees: await versBase64(p.blob),
      })),
    ),
  };
}

export type ResultatImport =
  { ok: true; ajoutees: number; ignorees: string[] } | { ok: false; erreurs: string[] };

/**
 * Importe un export : tout est vérifié avant d’écrire quoi que ce soit. Une recette déjà présente
 * (même identifiant) n’est jamais écrasée : elle est ignorée et signalée.
 */
export async function importer(base: BaseFournee, donnees: unknown): Promise<ResultatImport> {
  const lecture = lireExport(donnees);
  if (!lecture.ok) return lecture;
  const { recettes, photos } = lecture.contenu;
  return base.transaction('rw', base.recettes, base.photos, async () => {
    const presentes = new Set(await base.recettes.toCollection().primaryKeys());
    const nouvelles = recettes.filter((r) => !presentes.has(r.id));
    const ignorees = recettes.filter((r) => presentes.has(r.id)).map((r) => r.nom);
    const utiles = new Set(nouvelles.flatMap((r) => r.photos));
    const aAjouter: Photo[] = photos
      .filter((p) => utiles.has(p.id))
      .map((p) => ({ id: p.id, blob: depuisBase64(p.donnees, p.type) }));
    await base.photos.bulkPut(aAjouter);
    await base.recettes.bulkAdd(nouvelles);
    return { ok: true, ajoutees: nouvelles.length, ignorees };
  });
}
