# AGENTS.md : Fournée (batch cooking)

Consignes pour les agents de code (Claude Code, Codex, Copilot…) et pour les humains qui travaillent sur ce dépôt. Le produit est décrit dans `docs/PLAN.md`, l’analyse des applications existantes dans `docs/BENCHMARK.md`, les décisions dans `docs/adr/`.

Les demandes explicites de l’utilisateur priment sur ce document.

## État du projet

**Version 1 livrée** les 25 et 26 novembre 2026 : lots 0 à 5 du plan, une spec par lot (`docs/specs/001` à `006`), toutes au statut « livrée ». Les lots 2 à 5 ont été validés par délégation (objectif donné par l’utilisateur : « livrer l’application en suivant le plan et les décisions prises ») ; les choix faits en route sont écrits dans chaque spec et dans les ADR. La maquette reste en ligne comme référence visuelle (https://gharel.github.io/cooking/maquette/).

**Lot 6 livré** le 26 novembre 2026 (spec `007`, ADR `0003`) : widget « Ce soir », plan B (adresses, roulette), rappel du dîner et agenda `.ics`, recettes du soir, session à plusieurs (prénoms, charge partagée), hygiène et ménage dans le déroulé. Toute nouvelle fonctionnalité repart d’une spec `docs/specs/008-…`.

## Le produit

Une application web responsive (téléphone d’abord), locale d’abord, pour le batch cooking : choisir les recettes de la semaine, faire les courses, **mener la session de cuisine grâce à un déroulé calculé** (étapes de plusieurs recettes fusionnées par poste : plan de travail, feux, four, refroidissement), suivre les plats au frigo et au congélateur, **finir ce qu’il reste** (idées et mini-session anti-gaspi) et garder **les recettes de famille ou maison** telles qu’on les raconte. Thème clair, sombre ou système. Interface et contenus en français.

## Organisation

```
index.html                 Métadonnées, script du thème en ligne (avant l’affichage), point de montage
src/main.tsx               Polices, styles, routage par ancre, montage, typographie, service worker
src/app/                   Coque, routage, thème, icônes, typographie du DOM, écrans à la demande (aLaDemande),
                           état partagé en signaux (bibliotheque-, fournee-, session-, stock-, soir-etat), alarme,
                           partage ; soir-etat (adresses, rappel du dîner) se charge à part, hors du démarrage
src/domaine/               Logique pure, sans DOM, testée : modèle, dictionnaire, ingrédients, structuration,
                           durées, bibliothèque, validation, dates, portions, fournée (répartition, alertes),
                           courses, ordonnanceur (hygiène et ménage compris), session (direct), stock (frigo,
                           rappels, restes), idées, soir (dîner du jour, roulette, adresses, agenda .ics),
                           schema-org (import web), partage (statistiques, textes), typographie
src/donnees/               IndexedDB (Dexie, schéma v3), recettes, photos, fournées, réglages, adresses, export et import
src/ecrans/                Un écran par fichier, chargé à la demande ; sous-dossiers recettes/, semaine/, session/
src/styles/                jetons.css (seul fichier où une couleur est écrite), base, composants, coque, un par écran
public/favicon.svg         Logo bocal ; icônes PWA générées au build (pwa-assets.config.ts)
maquette/index.html        Maquette de référence (données fictives), copiée dans dist/maquette/
outils/budget.js           Poids du JavaScript de démarrage (60 ko gzip au plus)
tests/domaine/             Vitest ; ordonnanceur.test.ts vérifie ses propriétés avec fast-check ;
                           depart.test.ts compare l’annexe 002 aux données
tests/donnees/             Vitest + fake-indexeddb : installation, duplication, suppression, export et import
tests/e2e/                 Playwright + axe-core ; iphone.spec.ts tourne dans WebKit (iPhone 13)
docs/                      PLAN.md, BENCHMARK.md, adr/ (décisions), specs/ (une par fonctionnalité), captures/
```

Les recettes de départ (`src/donnees/recettes-de-depart.ts`) sont la source unique : l’annexe `docs/specs/002-recettes-de-depart.md` en est générée par `npm run annexe` ; ne jamais la modifier à la main. Les durées « actif » et « total » sont calculées (`src/domaine/durees.ts`), jamais écrites à la main.

## Commandes

| Commande                                 | Rôle                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm install`                            | Dépendances **et hooks git** (`check` avant commit, `test:e2e` et `budget` avant push)   |
| `npx playwright install chromium webkit` | Navigateurs des tests e2e (une fois)                                                     |
| `npm run dev`                            | Serveur de développement Vite (http://localhost:5173/)                                   |
| `npm run check`                          | ESLint, Prettier, TypeScript, html-validate, Vitest                                      |
| `npm run test:e2e`                       | Build puis Playwright + axe : 5 écrans × 5 tailles × 2 thèmes, thème, hors ligne, iPhone |
| `npm run budget`                         | Poids du JavaScript de démarrage, après un build                                         |
| `npm run annexe`                         | Régénère l’annexe des recettes de départ après une modification des données              |
| `npm run build`                          | Build de production dans `dist/` (base `/cooking/`, maquette comprise)                   |
| `npm run apercu`                         | Sert `dist/` sur http://localhost:4182/cooking/ ; `PORT_E2E` change le port des tests    |

## Façon de travailler

1. **Lire avant d’écrire** : `docs/PLAN.md`, la spec concernée dans `docs/specs/` et les fichiers touchés.
2. **Une fonctionnalité = une spec courte** (`docs/specs/NNN-nom.md` : contexte, critères d’acceptation vérifiables, hors périmètre), validée par l’utilisateur, **puis les tests, puis le code**.
3. **Une décision structurante** (dépendance d’exécution, format de données, stockage, hébergement) = un ADR dans `docs/adr/NNNN-titre.md`. Pas de nouvelle dépendance sans besoin concret.
4. **Petits changements ciblés**, un sujet par commit. Fonctions pures dans `src/domaine/`, effets de bord aux bords.
5. **Sous-agents** seulement si l’utilisateur le demande ; leur attribuer des fichiers distincts.
6. **Ce fichier est la mémoire partagée du projet** : le mettre à jour quand une règle ou une commande change, en restant court. `CLAUDE.md` ne fait que l’importer.
7. **Rendre compte honnêtement** : ce qui a changé, ce qui a été vérifié, ce qui ne l’a pas été. Ne jamais annoncer un parcours navigateur, un test ou un déploiement non exécuté.

## Règles

- **Français partout** : identifiants, commentaires, textes affichés, messages de commit (Conventional Commits : `feat(session): …`, `fix(courses): …`).
- **Typographie** : apostrophe ’, guillemets « », points de suspension … ; pas de tiret cadratin ni demi-cadratin (trait d’union `-`, deux-points ou point médian `·`). Écrire des espaces ordinaires : la fonction de typographie (comme `src/lib/typo.ts` du quiz) les rend insécables à l’affichage (avant `: ; ! ? » · % €`, après `«`, entre un nombre et son unité, dans « 14 h 05 »). Dans les attributs (`aria-label`, `title`) et dans `document.title`, écrire `&nbsp;` ou `\u00a0`. Dans le code, toujours la séquence d’échappement `\u00a0`, jamais le caractère insécable lui-même (invisible ; ESLint le refuse avec `no-irregular-whitespace`). Un outil qui écrit des fichiers à partir de JSON transforme cette séquence en vrai caractère : vérifier avec `npm run lint`.
- **Charte propre à Fournée** (projet personnel, **pas** la charte Skazy Formation) : Fraunces pour les titres, Figtree pour le texte, terracotta en couleur principale, fond papier chaud ; la maquette fait référence.
- **Pilules** (boutons, pastilles, filtres, étiquettes) : rayon égal à la moitié de la hauteur d’une ligne (22 px pour un bouton de 44 px, 12 px pour une pastille), **jamais 999px** : sur téléphone, une étiquette qui passe sur deux lignes doit rester un rectangle arrondi propre, avec un peu de marge verticale. Un test e2e le vérifie à 360 px.
- **Pas d’emoji** : icônes SVG en sprite (dessin Lucide, licence ISC) dans `src/app/icones.tsx`, toujours décoratives (`aria-hidden`).
- **Routage par ancre** (`#semaine`, `#reste`…) dans `src/app/routage.ts` : pas de réécriture d’adresse sur GitHub Pages. Une ancre inconnue affiche Semaine. Un lien interne qui n’est pas un écran (lien d’évitement) empêche le changement d’ancre.
- **Couleurs** : uniquement des jetons (`--fond`, `--texte`, `--primaire`…, `--r-<recette>` pour les couleurs de recettes), définis en clair et en sombre. Contraste AA vérifié pour tout texte (4,5:1) et toute bordure de contrôle (3:1), dans les deux thèmes.
- **Thème commun aux outils de gharel.github.io** (règle « Thème commun aux outils » de `www/pro/AGENTS.md`) : choix gardé dans `localStorage` sous `skazy-outils:theme` (`"light"` ou `"dark"` en JSON ; pas de clé = système), appliqué par un script en ligne du `<head>` avant l’affichage ; bouton `#bouton-theme` à trois états (système, clair, sombre) nommé exactement `Thème : celui du système. Changer de thème` (puis `clair`, `sombre`), espace insécable avant les deux-points ; événements `storage` et `pageshow` (persisted) écoutés. Le clair choisi impose `color-scheme: only light`. `<meta name="darkreader-lock" />` suit `<meta name="color-scheme" content="light dark" />` : sans ce verrou, le mode nuit de Brave sur iPhone (Dark Reader) repeint la page.
- **Responsive** : barre d’onglets en bas sur téléphone (zones sûres `env(safe-area-inset-*)`), barre latérale à partir de 900 px. Cibles d’au moins 44 px (36 px pour les boutons secondaires compacts). Aucun défilement horizontal de la page ; la frise de session défile dans son propre cadre.
- **Accessibilité** : WCAG 2.2 AA, navigation au clavier, focus visible, `prefers-reduced-motion` respecté, une seule `h1` par écran, le focus va sur la `h1` après un changement d’écran.
- **Hors ligne** : `vite-plugin-pwa` (Workbox, `autoUpdate`, `clientsClaim`, `skipWaiting`) met tout le site en cache, sauf la maquette et les sous-ensembles de polices inutiles au français. La navigation vers `/maquette/` n’est jamais servie par l’application (`navigateFallbackDenylist`).
- **Données** : locales (IndexedDB), aucun compte, aucune télémétrie, aucune ressource distante à l’exécution (polices auto-hébergées par `@fontsource-variable` ; la maquette, elle, charge Google Fonts). Export et import JSON versionnés ; un import invalide est refusé sans rien écraser. Schéma Dexie versionné (`src/donnees/base.ts`) : toute évolution ajoute une version, sa migration et un test. Le stockage persistant est demandé ; s’il est refusé, un avertissement (masquable) conseille l’installation et l’export.
- **Recettes de famille** : le texte saisi est conservé à l’identique et toujours consultable ; la structuration (étapes, durées, postes) n’est qu’une proposition, enregistrée seulement après relecture, et toute valeur devinée est signalée comme telle. Ne jamais réécrire ni « corriger » le texte d’origine.
- **Dépôt public** : aucune vraie recette de famille, photo, nom de proche ni donnée personnelle dans le dépôt, les tests ou les captures. Exemples fictifs seulement. Exception voulue par l’utilisateur (26 novembre 2026) : les prénoms de test des participants sont « Guillaume » et « Hélène ».
- **Sécurité alimentaire** : les durées de conservation sont des valeurs par défaut prudentes (3 jours au frigo, 3 mois au congélateur), modifiables par recette et accompagnées de leur source. Ne jamais présenter l’application comme un avis sanitaire.
- **Ordonnanceur** : fonction pure et déterministe (`src/domaine/ordonnanceur.ts`). Toute modification garde les propriétés testées avec fast-check : dépendances respectées, aucun feu ni cuisinier en double emploi, 2 plats au plus et une seule température par four, durée au moins égale au chemin critique, tâches figées respectées. La session en direct (`src/domaine/session.ts`) fige les tâches réellement commencées (dépendances finies, cuisinier libre) et recalcule le reste à partir de « maintenant ». Une tâche active va à la personne libre qui a le moins travaillé. `ajouterHygiene` ajoute lavage des mains, vaisselle, nettoyage et rangement, et fait passer les légumes avant la viande crue ; le lavage de la planche fait partie de la découpe crue (même personne). Les options d’une session sont figées à son lancement.
- **Écritures de la fournée** : toujours par `modifierFournee` (`src/app/fournee-etat.ts`), qui applique en mémoire puis met l’écriture en file ; ne jamais écrire la fournée courante directement, sous peine d’écraser une modification plus récente.
- **Écrans à la demande** : chaque écran est un morceau séparé (`aLaDemande`), préchargé après le premier affichage ; le budget de démarrage (60 ko) le vérifie. Un nouvel écran suit le même chemin.
- **Partage et import** : un fichier de recette partagé est un export Fournée (sous-recettes et photos comprises) ; l’import web lit le JSON-LD schema.org collé (pas de lecture d’adresse : CORS) ; les partages reçus arrivent en `?titre=&texte=&adresse=` (Web Share Target).
- **Reconnaissance de texte** : reportée (ADR 0002).
- **Ce soir** : le dîner du jour vient d’abord du choix de dernière minute (réglages, valable le jour dit), puis du planning (fournée courante, puis semaine de la dernière session). Les recettes « du soir » se cuisinent le jour même : courses oui, session et alertes de conservation non. Notification seulement application ouverte ou en arrière-plan ; l’agenda `.ics` est la voie sûre (ADR 0003). Liens des adresses : `http` ou `https` seulement.

## Vérification

- Logique : tester un résultat observable, les cas limites, la non-mutation ; tests déterministes, sans réseau ni horloge réelle (minuteurs avec une horloge simulée).
- Interface : 360, 390, 820, 1280 et 1920 px, en clair et en sombre ; pas de défilement horizontal, aucun texte coupé, axe sans violation. Pour un souci de couleurs sur téléphone, penser d’abord à Brave iOS (Dark Reader) et le reproduire avec le paquet `darkreader` injecté dans Playwright WebKit (iPhone).
- Captures utiles dans `docs/captures/`, sans données personnelles.

## Git et publication

- Dépôt public `gharel/cooking`. La branche `main` est publiée sur https://gharel.github.io/cooking/ par `.github/workflows/pages.yml` (Node 24, `npm ci`, `check`, `test:e2e`, `budget`, puis `dist/`) : un push sur `main` est une publication. Vérifier le workflow et la page publiée avant d’annoncer un déploiement réussi.
- Environnement GitHub `github-pages` : seule la branche `main` peut publier (règle ajoutée à la création du dépôt).
- Actions épinglées par SHA (commentaire avec la version), comme dans Captif.
- Ne pas committer `node_modules/`, `dist/`, `dev-dist/`, rapports de tests, `.env`, identifiants ni réglages d’IDE.
- Fins de ligne LF partout (`.gitattributes`, Prettier `endOfLine: lf`), même avec `core.autocrlf=true`.
- Pas de `push --force`, de `reset --hard` ni de réécriture d’historique sans demande explicite.
