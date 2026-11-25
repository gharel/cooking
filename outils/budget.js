// Poids du JavaScript chargé au démarrage (compressé gzip), après `npm run build`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMITE = 60 * 1024;
const html = readFileSync('dist/index.html', 'utf8');
const fichiers = [...new Set([...html.matchAll(/(?:src|href)="\/cooking\/([^"]+\.js)"/g)].map((m) => m[1]))];

if (fichiers.length === 0) {
  console.error('Aucun script trouvé dans dist/index.html : lancer `npm run build` avant.');
  process.exit(1);
}

let total = 0;
for (const fichier of fichiers) {
  const taille = gzipSync(readFileSync(join('dist', fichier))).length;
  total += taille;
  console.log(`${(taille / 1024).toFixed(1).padStart(6)} ko  ${fichier}`);
}
console.log(`${(total / 1024).toFixed(1).padStart(6)} ko  au total (limite ${LIMITE / 1024} ko)`);
if (total > LIMITE) {
  console.error('Budget de JavaScript dépassé.');
  process.exit(1);
}
