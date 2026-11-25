import { describe, expect, it } from 'vitest';
import { CLE_THEME, NOMS_THEME, lireTheme, themeSuivant } from '../../src/app/theme';

const stockage = (valeur: string | null) => ({
  getItem: (cle: string) => (cle === CLE_THEME ? valeur : null),
});

describe('thème commun aux outils', () => {
  it('utilise la clé partagée par les outils de gharel.github.io', () => {
    expect(CLE_THEME).toBe('skazy-outils:theme');
  });

  it('passe de système à clair, sombre, puis système', () => {
    expect(themeSuivant(null)).toBe('light');
    expect(themeSuivant('light')).toBe('dark');
    expect(themeSuivant('dark')).toBeNull();
  });

  it.each([
    [JSON.stringify('light'), 'light'],
    [JSON.stringify('dark'), 'dark'],
    [null, null],
    [JSON.stringify('bleu'), null],
    ['pas du JSON', null],
  ])('lit %s comme %s', (valeur, attendu) => {
    expect(lireTheme(stockage(valeur))).toBe(attendu);
  });

  it('reste sur le thème du système si le stockage est inaccessible', () => {
    expect(
      lireTheme({
        getItem: () => {
          throw new Error('bloqué');
        },
      }),
    ).toBeNull();
  });

  it('nomme le bouton exactement comme les autres outils', () => {
    expect(NOMS_THEME).toEqual({
      systeme: 'Thème\u00a0: celui du système. Changer de thème',
      light: 'Thème\u00a0: clair. Changer de thème',
      dark: 'Thème\u00a0: sombre. Changer de thème',
    });
  });
});
