import { describe, expect, it } from 'vitest';
import { typographier } from '../../src/domaine/typographie';

const _ = '\u00a0';

describe('typographier', () => {
  it.each([
    ['Thème : clair', `Thème${_}: clair`],
    ['Vraiment ? Oui ! Bon ; voilà', `Vraiment${_}? Oui${_}! Bon${_}; voilà`],
    ['« Bonjour »', `«${_}Bonjour${_}»`],
    ['Semaine · Fournée', `Semaine${_}· Fournée`],
    ['6 portions', `6${_}portions`],
    ['1,2 kg de courge', `1,2${_}kg de courge`],
    ['à 14 h 05', `à 14${_}h${_}05`],
    ['à 14 h', `à 14${_}h`],
    ['150 000 utilisateurs', `150${_}000${_}utilisateurs`],
    ['Prix : 12 €', `Prix${_}: 12${_}€`],
    ['50 %', `50${_}%`],
    ['Fournée n° 12', `Fournée n°${_}12`],
  ])('%s', (entree, attendu) => {
    expect(typographier(entree)).toBe(attendu);
  });

  it('laisse intact un texte sans règle à appliquer', () => {
    expect(typographier('Rien à changer ici.')).toBe('Rien à changer ici.');
  });

  it('ne touche pas aux minuteurs ni aux heures écrites avec deux-points', () => {
    expect(typographier('09:00')).toBe('09:00');
  });

  it('est idempotente', () => {
    const texte = 'Session : 2 h 05 « au lieu de » 3 h 40 ; 1 200 g !';
    expect(typographier(typographier(texte))).toBe(typographier(texte));
  });
});
