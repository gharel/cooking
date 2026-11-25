# 001 : fondations

- Statut : **validée** le 25 novembre 2026
- Lot : 0 (voir `docs/PLAN.md`, section 10)

## Contexte

Le cadrage est validé (plan, maquette, ADR 0001 : Vite, TypeScript strict, Preact). Ce lot pose le socle sur lequel tous les autres s’appuient : projet, outillage qualité, coque de l’application (navigation, thème, typographie), fonctionnement hors ligne et publication. Aucune fonctionnalité métier ici : les cinq écrans existent mais restent vides.

Aujourd’hui, https://gharel.github.io/cooking/ affiche la maquette. Après ce lot, l’application prend la racine et **la maquette reste en ligne** sous `/cooking/maquette/` ; chaque écran vide renvoie vers son équivalent dans la maquette, pour ne rien perdre de ce qu’on voit aujourd’hui.

## Ce qui est livré

1. **Projet** : Vite, TypeScript strict, Preact et `@preact/signals`, Node 24 (comme Captif). `base` à `/cooking/` en production, `/` en développement.
2. **Coque** reprise de la maquette :
   - bandeau (logo, nom, bouton du thème), navigation en barre d’onglets en bas sur téléphone, en barre latérale à partir de 900 px ;
   - cinq écrans : Semaine, Courses, Session, Frigo, Recettes ; une seule `h1` par écran, titre d’onglet « Écran · Fournée » ;
   - routage par ancre (`#semaine`, `#frigo`…), sans dépendance : il fonctionne sur GitHub Pages sans réécriture d’adresses ; `#reste` ouvre Frigo sur l’onglet « Ce qu’il reste » (prévu pour le lot 4) ;
   - après un changement d’écran, le focus va sur la `h1` ; lien d’évitement « Aller au contenu » ;
   - chaque écran vide affiche « Arrive au lot N » et un lien « Voir cet écran dans la maquette ».
3. **Styles** : jetons de la maquette (clair et sombre) dans `src/styles/jetons.css`, seul fichier où une couleur est écrite ; composants de base (bouton, carte, pastille) dans `src/styles/composants.css`. Polices Fraunces et Figtree **auto-hébergées** (woff2 dans le build, aucune requête vers Google).
4. **Thème** : règle commune de `AGENTS.md` (clé `skazy-outils:theme`, script en ligne du `<head>`, bouton à trois états, `storage` et `pageshow`, `color-scheme: only light` en clair choisi, `darkreader-lock` après `color-scheme`, `theme-color` mis à jour).
5. **Typographie** : `src/domaine/typographie.ts`, fonction pure (espaces insécables avant `: ; ! ? » · % €`, après `«`, entre un nombre et son unité, dans « 14 h 05 ») ; appliquée au texte affiché par une passe sur le DOM de l’application, relancée à chaque rendu (`MutationObserver`), comme le quiz.
6. **Hors ligne et installation** : `vite-plugin-pwa` (Workbox) ; manifeste (nom « Fournée », couleurs du thème, icônes 192, 512 et masquable, `apple-touch-icon`) tirées du logo bocal en SVG ; tout le site est mis en cache au premier passage.
7. **Qualité** :
   - `npm run check` : ESLint, Prettier, html-validate, `tsc --noEmit`, Vitest ;
   - `npm run test:e2e` : build puis Playwright + axe-core ;
   - `npm run budget` : poids du JavaScript chargé au démarrage ;
   - hooks git (`simple-git-hooks`) : `check` avant chaque commit, `test:e2e` avant chaque push.
8. **Publication** : le workflow `pages.yml` fait `npm ci`, `check`, `test:e2e`, `build`, puis publie `dist/`, qui contient aussi `maquette/index.html`. Actions épinglées par SHA, publication retentée deux fois en cas d’échec (déjà en place).
9. **Référencement** : `<meta name="robots" content="noindex">` jusqu’à la V1, comme les autres outils de gharel.github.io.

## Critères d’acceptation

- [x] `npm ci` puis `npm run check` passent sur une copie propre, sans avertissement TypeScript.
- [x] Pour chacun des 5 écrans, à 360, 390, 820, 1280 et 1920 px, en clair et en sombre : aucun défilement horizontal, aucune violation axe (WCAG 2.0 A et AA, 2.1 AA, 2.2 AA), exactement une `h1`, titre d’onglet attendu.
- [x] Un clic dans la navigation affiche l’écran, met `aria-current="page"` sur son lien et place le focus sur sa `h1` ; un lien `#reste` affiche Frigo ; une ancre inconnue affiche Semaine.
- [x] Le bouton du thème passe de système à clair, sombre puis système, avec les noms exacts de `AGENTS.md` ; le choix survit au rechargement, s’applique avant le premier affichage (pas de flash) et se propage à un deuxième onglet ouvert (`storage`).
- [x] `<meta name="darkreader-lock">` suit `<meta name="color-scheme" content="light dark">`.
- [x] Après une première visite, la page se recharge **hors ligne** et affiche la coque (test Playwright avec réseau coupé) ; le manifeste est valide et déclare les icônes 192, 512 et masquable.
- [x] Aucune requête vers une autre origine pendant le chargement (polices comprises).
- [x] `typographier()` est couverte par des tests (deux-points, guillemets, nombres et unités, heures, grands nombres, texte déjà correct inchangé) ; un test refuse tout tiret cadratin ou demi-cadratin dans `src/`.
- [x] JavaScript chargé au démarrage : 60 ko compressés au plus (le plan en autorise 100 ; garder la marge pour les lots suivants).
- [ ] Après un push sur `main`, le workflow passe ; https://gharel.github.io/cooking/ affiche l’application, https://gharel.github.io/cooking/maquette/ la maquette.
- [x] Vérifié en émulation iPhone (Playwright WebKit) : thème sombre du système, mode clair choisi, aucun repeint par Dark Reader (paquet `darkreader` injecté).

## Hors périmètre

- Données et IndexedDB (Dexie) : lot 1, avec les recettes.
- Contenu des écrans : lots 1 à 4.
- Icône définitive et nom définitif : le logo bocal et « Fournée » restent provisoires.
- Notifications et maintien de l’écran allumé : lot 3 (session).

## Notes techniques

```
index.html                 Métadonnées, script du thème en ligne, point de montage
src/main.tsx               Montage Preact, enregistrement du service worker
src/app/Coque.tsx          Bandeau, navigation, zone d’écran
src/app/routage.ts         Ancre vers écran (+ onglet), signal de l’écran courant
src/app/theme.ts           Lecture, écriture et application du thème
src/app/typographie-dom.ts Passe sur le DOM (MutationObserver)
src/domaine/typographie.ts Fonction pure, testée
src/ecrans/*.tsx           Semaine, Courses, Session, Frigo, Recettes (vides)
src/styles/                jetons.css, composants.css, coque.css, polices
public/                    favicon.svg ; icônes PNG générées
outils/budget.js           Mesure du JavaScript de démarrage
tests/domaine/             Vitest
tests/e2e/                 Playwright + axe (coque, thème, hors ligne, origines)
```

- Dépendances d’exécution : `preact`, `@preact/signals`, `workbox-window` (via le plugin). Tout le reste en dépendances de développement : `vite`, `@preact/preset-vite`, `typescript`, `vite-plugin-pwa`, `@vite-pwa/assets-generator`, polices `@fontsource` (Fraunces, Figtree), `vitest`, `@playwright/test`, `@axe-core/playwright`, `darkreader`, `eslint` et `typescript-eslint`, `prettier`, `html-validate`, `simple-git-hooks`.
- La maquette reste à la racine du dépôt (`maquette/`) et devient la référence visuelle ; le build la copie dans `dist/maquette/`.
- Risque : le service worker peut servir une ancienne version après publication. Mise à jour automatique (`registerType: 'autoUpdate'`) et nouvelle version prise au rechargement suivant ; à vérifier dans le test hors ligne.
