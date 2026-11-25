# Fournée

Application web de batch cooking : vos recettes (y compris celles de la famille), une session de cuisine orchestrée, un frigo sous contrôle.

> **Version 1 en ligne : https://gharel.github.io/cooking/** (installable, utilisable hors ligne). La maquette de départ reste visible sur https://gharel.github.io/cooking/maquette/. Nom de travail : « Fournée ».

## Ce que fait l’application

| Écran    | Rôle                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Semaine  | Plats de la fournée (portions demandées, 4 proposé), répartition des repas, alertes de conservation, rappels de décongélation, statistiques, partage |
| Courses  | Liste consolidée par rayon (une ligne par ingrédient, quantités mises à l’échelle), placard, articles cochés, partage                                |
| Session  | Déroulé calculé (recettes menées de front, feux et fours partagés), puis guidage en direct : « Maintenant », minuteurs, frise, mode cuisine          |
| Frigo    | Plats préparés (fraîcheur, manger, congeler, décongeler) ; « Ce qu’il reste » : idées anti-gaspi et mini-session sans achat                          |
| Recettes | 13 recettes de départ, recettes de famille racontées puis structurées, photos, import web (schema.org), partage, impression, export et import        |

Locale d’abord : pas de compte, pas d’abonnement, données sur l’appareil (exportables). Thème clair, sombre ou système.

## Développement

Node 24. Vite, TypeScript strict, Preact, Dexie (voir `docs/adr/`).

```sh
npm install                              # dépendances et hooks git
npx playwright install chromium webkit   # navigateurs des tests e2e, une fois
npm run dev                              # http://localhost:5173/
npm run check                            # lint, format, types, HTML, tests unitaires
npm run test:e2e                         # build puis tests Playwright + axe
```

Un push sur `main` lance les vérifications puis publie le site.

## Documentation

- [Plan produit et technique](docs/PLAN.md)
- [Analyse des applications existantes](docs/BENCHMARK.md)
- [Décisions d’architecture](docs/adr/)
- [Specs des fonctionnalités](docs/specs/) (une par lot, toutes livrées)
- [Consignes pour les agents et les contributeurs](AGENTS.md)
