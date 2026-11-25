import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  enregistrerAdresse,
  installerAdressesDeDepart,
  lireAdresses,
  supprimerAdresse,
} from '../../src/donnees/adresses';
import { BaseFournee } from '../../src/donnees/base';
import { enregistrerReglages, lireReglages } from '../../src/donnees/fournees';

let base: BaseFournee;
let numero = 0;

beforeEach(() => {
  base = new BaseFournee(`adresses-${numero++}`);
});
afterEach(async () => {
  await base.delete();
});

describe('adresses du plan B', () => {
  it('les trois adresses de départ sont installées une seule fois', async () => {
    await installerAdressesDeDepart(base);
    expect((await lireAdresses(base)).map((a) => a.nom)).toEqual(['Burger King', 'Gino Pizza', 'Indi Kitch']);
    await supprimerAdresse(base, 'adresse-burger-king');
    await installerAdressesDeDepart(base);
    expect((await lireAdresses(base)).map((a) => a.nom)).toEqual(['Gino Pizza', 'Indi Kitch']);
  });

  it('une adresse ajoutée est gardée (base rouverte)', async () => {
    await installerAdressesDeDepart(base);
    await enregistrerAdresse(base, {
      id: 'adresse-test',
      nom: '  Le snack du coin ',
      type: 'Sandwichs',
      adresse: '1 rue des Exemples',
      telephone: '',
      lien: '',
    });
    const nom = base.name;
    base.close();
    base = new BaseFournee(nom);
    const noms = (await lireAdresses(base)).map((a) => a.nom);
    expect(noms).toContain('Le snack du coin');
    expect(noms).toHaveLength(4);
  });

  it('les réglages gardent participants, lave-vaisselle, heure du dîner et choix du soir', async () => {
    const r = await lireReglages(base);
    await enregistrerReglages(base, {
      ...r,
      participants: ['Guillaume', 'Hélène'],
      laveVaisselle: false,
      heureDiner: '20:00',
      choixDuSoir: { jour: '2026-12-01', recetteId: null, adresseId: 'adresse-gino-pizza' },
    });
    expect(await lireReglages(base)).toMatchObject({
      participants: ['Guillaume', 'Hélène'],
      laveVaisselle: false,
      heureDiner: '20:00',
      choixDuSoir: { adresseId: 'adresse-gino-pizza' },
    });
  });
});

describe('migration du schéma v2 vers v3', () => {
  it('ajoute la table des adresses et marque les recettes existantes « pas du soir »', async () => {
    const nom = `migration-${numero++}`;
    const ancienne = new Dexie(nom);
    ancienne.version(1).stores({ recettes: 'id, nom', photos: 'id', reglages: 'cle' });
    ancienne.version(2).stores({ fournees: 'id, statut', plats: 'id, lieu', restes: 'id' });
    await ancienne.open();
    await ancienne.table('recettes').put({ id: 'r1', nom: 'Recette de test' });
    ancienne.close();
    const nouvelle = new BaseFournee(nom);
    expect((await nouvelle.recettes.get('r1'))?.soir).toBe(false);
    expect(await nouvelle.adresses.count()).toBe(0);
    await nouvelle.delete();
  });
});
