import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}

it('aucun tiret cadratin ni demi-cadratin dans src/ et index.html', () => {
  const fautifs = [...fichiers('src'), 'index.html'].filter((f) => /[–—]/.test(readFileSync(f, 'utf8')));
  expect(fautifs).toEqual([]);
});
