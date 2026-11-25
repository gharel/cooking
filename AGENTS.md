# AGENTS.md : Fournée (batch cooking)

Consignes pour les agents de code (Claude Code, Codex, Copilot…) et pour les humains qui travaillent sur ce dépôt. Le produit est décrit dans `docs/PLAN.md`, l’analyse des applications existantes dans `docs/BENCHMARK.md`, les décisions dans `docs/adr/`.

Les demandes explicites de l’utilisateur priment sur ce document.

## État du projet

**Cadrage validé** le 25 novembre 2026 (plan, maquette, ADR 0001). Prochaine étape : lot 0 (fondations), qui commence par sa spec dans `docs/specs/`. En attendant, le site publié est la maquette (`maquette/index.html`).

## Le produit

Une application web responsive (téléphone d’abord), locale d’abord, pour le batch cooking : choisir les recettes de la semaine, faire les courses, **mener la session de cuisine grâce à un déroulé calculé** (étapes de plusieurs recettes fusionnées par poste : plan de travail, feux, four, refroidissement), suivre les plats au frigo et au congélateur, **finir ce qu’il reste** (idées et mini-session anti-gaspi) et garder **les recettes de famille ou maison** telles qu’on les raconte. Thème clair, sombre ou système. Interface et contenus en français.

## Organisation prévue (lot 0)

```
maquette/index.html   Maquette de référence (un seul fichier, données fictives) : écrans, jetons, composants
src/domaine/          Logique pure, sans DOM : ordonnanceur, regroupement, courses, conservation, portions, structuration, idées, typographie
src/donnees/          IndexedDB (Dexie), schéma versionné, migrations, export et import JSON
src/interface/        Composants Preact par écran : semaine, courses, session, frigo, recettes
src/styles/           Jetons clair et sombre (seul endroit où une couleur est écrite) et composants
src/pwa/              Manifeste et service worker
tests/domaine/        Vitest + fast-check
tests/e2e/            Playwright + axe-core
docs/                 PLAN.md, BENCHMARK.md, adr/ (décisions), specs/ (une par fonctionnalité)
```

## Commandes (à partir du lot 0)

| Commande           | Rôle                                                               |
| ------------------ | ------------------------------------------------------------------ |
| `npm run dev`      | Serveur de développement Vite                                      |
| `npm run check`    | ESLint, Prettier, html-validate, TypeScript, Vitest (avant commit) |
| `npm run test:e2e` | Build puis Playwright + axe, 5 écrans × 2 thèmes (avant push)      |
| `npm run build`    | Build de production dans `dist/`                                   |

Tant que ces commandes n’existent pas, vérifier la maquette en l’ouvrant dans un navigateur.

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
- **Typographie** : apostrophe ’, guillemets « », points de suspension … ; pas de tiret cadratin ni demi-cadratin (trait d’union `-`, deux-points ou point médian `·`). Écrire des espaces ordinaires : la fonction de typographie (comme `src/lib/typo.ts` du quiz) les rend insécables à l’affichage (avant `: ; ! ? » · % €`, après `«`, entre un nombre et son unité, dans « 14 h 05 »). Dans les attributs (`aria-label`, `title`), écrire `&nbsp;` ou ` `.
- **Charte propre à Fournée** (projet personnel, **pas** la charte Skazy Formation) : Fraunces pour les titres, Figtree pour le texte, terracotta en couleur principale, fond papier chaud ; la maquette fait référence.
- **Pas d’emoji** : icônes SVG en sprite (dessin Lucide, licence ISC), décoratives (`aria-hidden`).
- **Couleurs** : uniquement des jetons (`--fond`, `--texte`, `--primaire`…, `--r-<recette>` pour les couleurs de recettes), définis en clair et en sombre. Contraste AA vérifié pour tout texte (4,5:1) et toute bordure de contrôle (3:1), dans les deux thèmes.
- **Thème commun aux outils de gharel.github.io** (règle « Thème commun aux outils » de `www/pro/AGENTS.md`) : choix gardé dans `localStorage` sous `skazy-outils:theme` (`"light"` ou `"dark"` en JSON ; pas de clé = système), appliqué par un script en ligne du `<head>` avant l’affichage ; bouton `#bouton-theme` à trois états (système, clair, sombre) nommé exactement `Thème : celui du système. Changer de thème` (puis `clair`, `sombre`), espace insécable avant les deux-points ; événements `storage` et `pageshow` (persisted) écoutés. Le clair choisi impose `color-scheme: only light`. `<meta name="darkreader-lock" />` suit `<meta name="color-scheme" content="light dark" />` : sans ce verrou, le mode nuit de Brave sur iPhone (Dark Reader) repeint la page.
- **Responsive** : barre d’onglets en bas sur téléphone (zones sûres `env(safe-area-inset-*)`), barre latérale à partir de 900 px. Cibles d’au moins 44 px (36 px pour les boutons secondaires compacts). Aucun défilement horizontal de la page ; la frise de session défile dans son propre cadre.
- **Accessibilité** : WCAG 2.2 AA, navigation au clavier, focus visible, `prefers-reduced-motion` respecté, une seule `h1` par écran, le focus va sur la `h1` après un changement d’écran.
- **Données** : locales (IndexedDB), aucun compte, aucune télémétrie, aucune ressource distante à l’exécution (polices auto-hébergées ; la maquette, elle, charge Google Fonts). Export et import JSON versionnés ; un import invalide est refusé sans rien écraser.
- **Recettes de famille** : le texte saisi est conservé à l’identique et toujours consultable ; la structuration (étapes, durées, postes) n’est qu’une proposition, enregistrée seulement après relecture, et toute valeur devinée est signalée comme telle. Ne jamais réécrire ni « corriger » le texte d’origine.
- **Dépôt public** : aucune vraie recette de famille, photo, nom de proche ni donnée personnelle dans le dépôt, les tests ou les captures. Exemples fictifs seulement.
- **Sécurité alimentaire** : les durées de conservation sont des valeurs par défaut prudentes (3 jours au frigo, 3 mois au congélateur), modifiables par recette et accompagnées de leur source. Ne jamais présenter l’application comme un avis sanitaire.
- **Ordonnanceur** : fonction pure et déterministe (`src/domaine/ordonnanceur.ts`). Toute modification garde les propriétés testées : dépendances respectées, aucun poste ni cuisinier en double emploi, durée au moins égale au chemin critique.

## Vérification

- Logique : tester un résultat observable, les cas limites, la non-mutation ; tests déterministes, sans réseau ni horloge réelle (minuteurs avec une horloge simulée).
- Interface : 360, 390, 820, 1280 et 1920 px, en clair et en sombre ; pas de défilement horizontal, aucun texte coupé, axe sans violation. Pour un souci de couleurs sur téléphone, penser d’abord à Brave iOS (Dark Reader) et le reproduire avec le paquet `darkreader` injecté dans Playwright WebKit (iPhone).
- Captures utiles dans `docs/captures/`, sans données personnelles.

## Git et publication

- Dépôt public `gharel/cooking`. La branche `main` est publiée sur https://gharel.github.io/cooking/ par `.github/workflows/pages.yml` : un push sur `main` est une publication. Aujourd’hui le workflow publie le dossier `maquette/` ; au lot 0, il lancera `check` et les tests e2e puis publiera `dist/`. Vérifier le workflow et la page publiée avant d’annoncer un déploiement réussi.
- Actions épinglées par SHA (commentaire avec la version), comme dans Captif.
- Ne pas committer `node_modules/`, `dist/`, rapports de tests, `.env`, identifiants ni réglages d’IDE.
- Fins de ligne CRLF dans la copie de travail (`core.autocrlf=true`). Sous Git Bash, `sed -i` les retire : les rétablir avant de commiter.
- Pas de `push --force`, de `reset --hard` ni de réécriture d’historique sans demande explicite.
