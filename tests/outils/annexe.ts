import { correspond, type Filtre } from '../../src/domaine/bibliotheque';
import { dureeActive, dureeTotale } from '../../src/domaine/durees';
import { POSTES, estCongelable, passeAuFour, type Etape, type Recette } from '../../src/domaine/modele';
import { formaterDuree } from '../../src/domaine/texte';

const SOURCES = [
  '[Brandade de morue](https://www.jardiner-malin.fr/recettes/brandade-de-morue.html), Jardiner Malin ; [Recette de la brandade de morue](https://www.routard.com/contenu-dossier/cid139416-recette-de-la-brandade-de-morue.html), Routard : 500 à 600 g de morue et 600 g de pommes de terre pour 4, dessalage de 24 h en changeant l’eau 3 ou 4 fois.',
  '[Le gratin dauphinois traditionnel](https://www.consoglobe.com/recette-gratin-dauphinois-cg), Consoglobe ; [Gratin de patates douces et pommes de terre](https://ileauxepices.com/blog/2018/03/05/recette-gratin-de-patates-douces-et-pommes-de-terre-aux-epices/wpid16212/), Île aux épices : environ 1 kg de tubercules, 180 °C, 50 à 60 min.',
  '[La quiche sans pâte](https://www.gralon.net/articles/gastronomie-et-alimentation/alimentation/article-la-quiche-sans-pate---une-recette-facile-10416.htm), Gralon ; [Quiche sans pâte](https://www.vorwerk.com/fr/fr/c/vorwerk/astuces-recettes/blog/thermomix/recettes-quotidien/recette-de-quiche-sans-pate), Vorwerk ; [Quiche sans pâte poireaux et lardons](https://www.demotivateur.fr/food/la-quiche-sans-pate-simple-et-rapide-en-5-etapes-aux-poireaux-et-lardons-47582), Démotivateur : 3 œufs, farine, lait et crème, 30 à 40 min à 180 °C.',
  'Omelette normande salée : aucune recette de référence trouvée ; proportions d’une omelette de 8 œufs pour 4 et des garnitures normandes courantes (pommes de terre, lardons, camembert, crème). À ajuster après un premier essai.',
  'Autres recettes (dahl, ratatouille, bolognaise, chili, riz cantonais, tian, lasagne, gratin d’aubergines, quiche lorraine) : proportions courantes des recettes familiales pour 4, temps de cuisson usuels.',
];

const FILTRES: [Filtre, string][] = [
  ['vegetarien', 'Végétarien'],
  ['four', 'Four'],
  ['congelable', 'Congelable'],
  ['rapide', '15 min actives ou moins'],
];

function ligneEtape(e: Etape, toutes: Etape[]): string {
  const rang = (id: string) => toutes.findIndex((x) => x.id === id) + 1;
  const morceaux = [
    e.texte,
    POSTES[e.poste].toLowerCase(),
    e.active ? 'actif' : 'passif',
    e.sousRecetteId ? 'sous-recette' : formaterDuree(e.dureeMin),
  ];
  if (e.apres.length) morceaux.push(`après ${e.apres.map(rang).join(' et ')}`);
  if (e.facultative) morceaux.push('facultative');
  if (e.anticiper === 'veille') morceaux.push('**à anticiper la veille**');
  return morceaux.join(' · ');
}

function tableau(lignes: string[][]): string {
  const largeurs = lignes[0]?.map((_, i) => Math.max(...lignes.map((l) => (l[i] ?? '').length))) ?? [];
  const rendre = (l: string[]) => `| ${l.map((c, i) => c.padEnd(largeurs[i] ?? 0)).join(' | ')} |`;
  const [entete, ...corps] = lignes;
  return [
    rendre(entete ?? []),
    `| ${largeurs.map((w) => '-'.repeat(w)).join(' | ')} |`,
    ...corps.map(rendre),
  ].join('\n');
}

const total = (r: Recette) =>
  formaterDuree(dureeTotale(r)) +
  (r.etapes.some((e) => e.sousRecetteId) ? ' + bolognaise' : '') +
  (r.etapes.some((e) => e.anticiper) ? ' + la veille' : '');

export function genererAnnexe(toutes: Recette[]): string {
  const recettes = toutes.filter((r) => !r.soir);
  const soir = toutes.filter((r) => r.soir);
  const vueSoir = tableau([
    ['Recette du soir', 'Actif', 'Total', 'Végétarien', 'Four'],
    ...soir.map((r) => [
      r.nom,
      formaterDuree(dureeActive(r)),
      total(r),
      r.vegetarien ? 'oui' : '',
      passeAuFour(r) ? 'oui' : '',
    ]),
  ]);
  const vue = tableau([
    ['Recette', 'Actif', 'Total', 'Congelable', 'Végétarien', 'Four'],
    ...recettes.map((r) => [
      r.nom,
      formaterDuree(dureeActive(r)),
      total(r),
      estCongelable(r) ? `oui, ${r.conservation.congelateurMois} mois` : 'non',
      r.vegetarien ? 'oui' : '',
      passeAuFour(r) ? 'oui' : '',
    ]),
  ]);
  const filtres = FILTRES.map(([f, nom]) => `${nom} ${recettes.filter((r) => correspond(r, f)).length}`).join(
    ', ',
  );

  const fiches = toutes.map((r) => {
    const conservation = [
      `frigo ${r.conservation.frigoJours} jours`,
      r.conservation.congelateurMois === null
        ? 'ne se congèle pas'
        : `congélateur ${r.conservation.congelateurMois} mois`,
    ];
    const entete = [r.sousTitre, `${r.portions} portions`, ...conservation].filter(Boolean).join(' · ');
    return [
      `## ${r.nom}`,
      '',
      entete,
      ...(r.note ? ['', `> ${r.note}`] : []),
      '',
      ...r.ingredients.map((i) => `- ${i.texte}`),
      '',
      ...r.etapes.map((e, n) => `${n + 1}. ${ligneEtape(e, r.etapes)}`),
    ].join('\n');
  });

  return [
    '# Annexe 002 : les recettes de départ',
    '',
    '> Fichier **généré** à partir de `src/donnees/recettes-de-depart.ts` par `npm run annexe` : ne pas le modifier à la main. Un test vérifie qu’il est à jour.',
    '',
    '- Quantités et étapes vérifiées le 25 novembre 2026 (sources en fin de document).',
    `- ${recettes.length} recettes de session et ${soir.length} recettes du soir (lot 6 : à cuisiner le jour même, hors session).`,
    '- Toutes les recettes sont pour **4 portions** ; le nombre de portions se choisit au moment de prendre un plat.',
    '',
    'Lecture des étapes : texte · poste · actif ou passif · durée · dépendances. « Actif » occupe le cuisinier ; « passif » n’occupe que le poste (feu, four, repos). Durées « actif » et « total » calculées par `src/domaine/durees.ts` : « total » va jusqu’au plat prêt avec un seul cuisinier, sans le refroidissement final, les étapes facultatives ni ce qui se fait la veille.',
    '',
    '## Vue d’ensemble',
    '',
    vue,
    '',
    `Filtres attendus (recettes de session) : ${filtres}.`,
    '',
    '## Recettes du soir',
    '',
    vueSoir,
    '',
    fiches.join('\n\n'),
    '',
    '## Sources',
    '',
    ...SOURCES.map((s) => `- ${s}`),
    '',
  ].join('\n');
}
