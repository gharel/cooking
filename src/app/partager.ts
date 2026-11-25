import { annoncer } from './annonces';

/** Partage d’un texte : menu de partage du téléphone, sinon copie dans le presse-papiers. */
export async function partagerTexte(titre: string, texte: string): Promise<void> {
  try {
    if (navigator.share) {
      await navigator.share({ title: titre, text: texte });
      return;
    }
    await navigator.clipboard.writeText(texte);
    annoncer('Copié : collez-le où vous voulez.');
  } catch (e) {
    if ((e as Error).name !== 'AbortError') annoncer('Partage impossible sur cet appareil.');
  }
}

/** Partage d’un fichier : menu de partage s’il accepte les fichiers, sinon téléchargement. */
export async function partagerFichier(nom: string, contenu: string, titre: string): Promise<void> {
  const fichier = new File([contenu], nom, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [fichier] })) {
      await navigator.share({ files: [fichier], title: titre });
      return;
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return;
  }
  const url = URL.createObjectURL(fichier);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  lien.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  annoncer(`Fichier prêt : ${nom}. Envoyez-le ; il s’importe dans Fournée.`);
}
