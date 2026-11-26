import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BaseFournee } from '../../src/donnees/base';
import { enregistrerSauvegarde, lireSauvegarde } from '../../src/donnees/sauvegarde';

let base: BaseFournee;
let numero = 0;

beforeEach(() => {
  base = new BaseFournee(`sauvegarde-${numero++}`);
});
afterEach(async () => {
  await base.delete();
});

describe('état de la sauvegarde', () => {
  it('vaut « jamais » sur un appareil neuf', async () => {
    expect(await lireSauvegarde(base)).toEqual({ derniere: null, reporteeJusquA: null });
  });

  it('garde la date de la dernière sauvegarde et le report', async () => {
    const etat = { derniere: '2026-11-26T10:00:00.000Z', reporteeJusquA: '2026-12-03' };
    await enregistrerSauvegarde(base, etat);
    expect(await lireSauvegarde(base)).toEqual(etat);
  });

  it('ignore une valeur illisible', async () => {
    await base.reglages.put({ cle: 'sauvegarde', valeur: { derniere: 42, reporteeJusquA: ['x'] } });
    expect(await lireSauvegarde(base)).toEqual({ derniere: null, reporteeJusquA: null });
    await base.reglages.put({ cle: 'sauvegarde', valeur: 'n’importe quoi' });
    expect(await lireSauvegarde(base)).toEqual({ derniere: null, reporteeJusquA: null });
  });
});
