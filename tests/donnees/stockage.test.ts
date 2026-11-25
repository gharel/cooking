import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BaseFournee } from '../../src/donnees/base';
import { exporter, importer } from '../../src/donnees/echange';
import {
  annulerSuppression,
  dupliquerRecette,
  enregistrerPhoto,
  enregistrerRecette,
  installerRecettesDeDepart,
  listerRecettes,
  recettesDeDepartManquantes,
  supprimerRecette,
} from '../../src/donnees/recettes';

let base: BaseFournee;
let numero = 0;

beforeEach(() => {
  base = new BaseFournee(`test-${numero++}`);
});
afterEach(async () => {
  await base.delete();
});

describe('recettes de départ', () => {
  it('sont installées une seule fois', async () => {
    expect(await installerRecettesDeDepart(base)).toBe(13);
    expect(await installerRecettesDeDepart(base)).toBe(0);
    expect(await listerRecettes(base)).toHaveLength(13);
  });

  it('une recette supprimée ne revient pas, sauf réinstallation des manquantes', async () => {
    await installerRecettesDeDepart(base);
    await supprimerRecette(base, 'depart-dahl');
    expect(await installerRecettesDeDepart(base)).toBe(0);
    expect(await recettesDeDepartManquantes(base)).toBe(1);
    expect(await installerRecettesDeDepart(base, { manquantesSeulement: true })).toBe(1);
    expect(await listerRecettes(base)).toHaveLength(13);
  });

  it('une recette de départ modifiée n’est pas écrasée par la réinstallation', async () => {
    await installerRecettesDeDepart(base);
    const dahl = (await listerRecettes(base)).find((r) => r.id === 'depart-dahl');
    if (!dahl) throw new Error('dahl absent');
    await enregistrerRecette(base, { ...dahl, nom: 'Dahl de maman' });
    await installerRecettesDeDepart(base, { manquantesSeulement: true });
    expect((await base.recettes.get('depart-dahl'))?.nom).toBe('Dahl de maman');
  });
});

describe('modifier, dupliquer, supprimer', () => {
  it('la duplication copie aussi les photos, indépendamment', async () => {
    await installerRecettesDeDepart(base);
    const photo = await enregistrerPhoto(base, new Blob(['image'], { type: 'image/jpeg' }));
    const dahl = await base.recettes.get('depart-dahl');
    if (!dahl) throw new Error('dahl absent');
    await enregistrerRecette(base, { ...dahl, photos: [photo] });
    const copie = await dupliquerRecette(base, 'depart-dahl');
    expect(copie?.nom).toBe('Dahl de lentilles (copie)');
    expect(copie?.photos).toHaveLength(1);
    expect(copie?.photos[0]).not.toBe(photo);
    await supprimerRecette(base, 'depart-dahl');
    expect(await base.photos.get(copie?.photos[0] ?? '')).toBeDefined();
  });

  it('une suppression s’annule avec ses photos', async () => {
    await installerRecettesDeDepart(base);
    const photo = await enregistrerPhoto(base, new Blob(['image'], { type: 'image/jpeg' }));
    const chili = await base.recettes.get('depart-chili');
    if (!chili) throw new Error('chili absent');
    await enregistrerRecette(base, { ...chili, photos: [photo] });
    const suppression = await supprimerRecette(base, 'depart-chili');
    expect(await base.recettes.get('depart-chili')).toBeUndefined();
    expect(await base.photos.get(photo)).toBeUndefined();
    if (!suppression) throw new Error('rien à annuler');
    await annulerSuppression(base, suppression);
    expect((await base.recettes.get('depart-chili'))?.photos).toEqual([photo]);
    expect(await base.photos.get(photo)).toBeDefined();
  });
});

describe('export et import', () => {
  it('un export réimporté dans une base vierge redonne les mêmes recettes et photos', async () => {
    await installerRecettesDeDepart(base);
    const photo = await enregistrerPhoto(
      base,
      new Blob([new Uint8Array([1, 2, 3, 250])], { type: 'image/jpeg' }),
    );
    const ratatouille = await base.recettes.get('depart-ratatouille');
    if (!ratatouille) throw new Error('ratatouille absente');
    await enregistrerRecette(base, { ...ratatouille, photos: [photo] });

    const contenu = JSON.parse(JSON.stringify(await exporter(base)));
    const vierge = new BaseFournee(`test-${numero++}`);
    try {
      expect(await importer(vierge, contenu)).toEqual({ ok: true, ajoutees: 13, ignorees: [] });
      const trier = (l: { id: string }[]) => [...l].sort((a, b) => a.id.localeCompare(b.id));
      expect(trier(await listerRecettes(vierge))).toEqual(trier(await listerRecettes(base)));
      const octets = new Uint8Array(
        await ((await vierge.photos.get(photo))?.blob.arrayBuffer() ?? new ArrayBuffer(0)),
      );
      expect([...octets]).toEqual([1, 2, 3, 250]);
    } finally {
      await vierge.delete();
    }
  });

  it('une recette déjà présente est ignorée, jamais écrasée', async () => {
    await installerRecettesDeDepart(base);
    const contenu = JSON.parse(JSON.stringify(await exporter(base)));
    contenu.recettes[0].nom = 'Nom changé';
    const resultat = await importer(base, contenu);
    expect(resultat.ok && resultat.ajoutees).toBe(0);
    expect(resultat.ok && resultat.ignorees).toHaveLength(13);
    expect((await base.recettes.get(contenu.recettes[0].id))?.nom).not.toBe('Nom changé');
  });

  it('un fichier invalide est refusé sans rien modifier', async () => {
    await installerRecettesDeDepart(base);
    const contenu = JSON.parse(JSON.stringify(await exporter(base)));
    contenu.recettes.push({ ...contenu.recettes[0], id: 'nouvelle', nom: '' });
    const resultat = await importer(base, contenu);
    expect(resultat.ok).toBe(false);
    expect(await listerRecettes(base)).toHaveLength(13);
    expect(await base.recettes.get('nouvelle')).toBeUndefined();
  });
});
