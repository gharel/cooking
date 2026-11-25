# ADR 0001 : pile technique

- Statut : **accepté** (validé avec le plan)
- Date : 2026-11-25

## Contexte

Fournée est une application web locale d’abord : plusieurs écrans avec un état partagé (fournée de la semaine, session en cours, stock), des minuteurs en direct, un fonctionnement hors ligne et un hébergement statique sur GitHub Pages. Le cœur, l’ordonnanceur de session, est de la logique pure qui doit être testée sérieusement. Le code est écrit en grande partie par des agents : typage strict et tests rapides servent de garde-fous.

## Décision

- **Vite + TypeScript strict** : typage du modèle de données et de l’ordonnanceur, erreurs détectées avant l’exécution.
- **Preact + signaux** : composants et état réactif pour environ 3 ko ; l’écosystème React reste accessible si besoin.
- **CSS natif** avec jetons (`--fond`, `--texte`…) en clair et en sombre, sans framework CSS : la maquette en est la référence.
- **Dexie (IndexedDB)** pour les données, export et import JSON versionnés.
- **vite-plugin-pwa** pour le service worker et le manifeste.
- **Vitest + fast-check** pour le domaine, **Playwright + axe-core** pour les parcours et l’accessibilité.

## Options écartées

- **JavaScript sans framework** (comme Captif) : le plus léger, mais l’état partagé entre écrans et les minuteurs en direct demanderaient de réécrire un mini-framework.
- **React** : plus lourd (environ 45 ko) sans bénéfice ici.
- **Tailwind** : la maquette repose déjà sur des jetons CSS ; garder une seule source de couleurs simplifie le thème sombre et le verrou Dark Reader.
- **Backend et comptes** : hors périmètre du MVP (local d’abord).

## Conséquences

- Une dépendance d’exécution principale (Preact) et deux utilitaires (Dexie, Workbox).
- Toute nouvelle dépendance d’exécution passe par un ADR.
