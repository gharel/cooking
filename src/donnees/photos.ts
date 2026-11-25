/** Réduit une photo (fiche manuscrite) à 1600 px de côté au plus, en JPEG : assez lisible, peu lourd. */
export async function reduirePhoto(fichier: Blob, cote = 1600): Promise<Blob> {
  const image = await createImageBitmap(fichier);
  const echelle = Math.min(1, cote / Math.max(image.width, image.height));
  const toile = document.createElement('canvas');
  toile.width = Math.max(1, Math.round(image.width * echelle));
  toile.height = Math.max(1, Math.round(image.height * echelle));
  toile.getContext('2d')?.drawImage(image, 0, 0, toile.width, toile.height);
  image.close();
  return new Promise((resoudre, rejeter) =>
    toile.toBlob((b) => (b ? resoudre(b) : rejeter(new Error('Image illisible'))), 'image/jpeg', 0.82),
  );
}
