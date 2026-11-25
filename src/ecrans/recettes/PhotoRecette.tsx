import { useEffect, useState } from 'preact/hooks';
import { obtenirBase } from '../../donnees/base';
import { lirePhoto } from '../../donnees/recettes';

/** Photo stockée en local (IndexedDB), ou image tout juste choisie (blob). */
export function PhotoRecette({ id, blob, alt }: { id?: string; blob?: Blob; alt: string }) {
  const [adresse, setAdresse] = useState<string | null>(null);
  useEffect(() => {
    let annule = false;
    let url: string | null = null;
    (async () => {
      const source = blob ?? (id ? await lirePhoto(obtenirBase(), id) : undefined);
      if (!source || annule) return;
      url = URL.createObjectURL(source);
      setAdresse(url);
    })();
    return () => {
      annule = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, blob]);
  return adresse ? (
    <img class="photo-recette" src={adresse} alt={alt} />
  ) : (
    <span class="photo-recette vide" />
  );
}
