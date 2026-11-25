# Fournée

Application web de batch cooking : vos recettes (y compris celles de la famille), une session de cuisine orchestrée, un frigo sous contrôle.

> **Statut : lot 1 livré, les recettes.** L’application est en ligne sur https://gharel.github.io/cooking/ : bibliothèque avec 13 recettes de départ, recettes de famille, photos, export et import ; hors ligne. Les autres écrans arrivent lot par lot. La maquette complète reste visible sur https://gharel.github.io/cooking/maquette/ (données fictives). Nom de travail : « Fournée ».

## Ce que fera l’application

| Écran    | Rôle                                                                                                                    | Lot |
| -------- | ----------------------------------------------------------------------------------------------------------------------- | --- |
| Recettes | Bibliothèque aux étapes structurées ; recettes de famille ou maison saisies comme on les raconte, texte d’origine gardé | 1   |
| Semaine  | Recettes de la fournée, portions, répartition des repas, alertes de conservation                                        | 2   |
| Courses  | Liste consolidée par rayon (les oignons de toutes les recettes sur une ligne), placard, hors ligne                      | 2   |
| Session  | Déroulé calculé par poste (plan de travail, feux, four, refroidissement), minuteurs, mode cuisine                       | 3   |
| Frigo    | Plats préparés avec dates limites et rappels ; « Ce qu’il reste » : idées et mini-session anti-gaspi                    | 4   |

Locale d’abord : pas de compte, pas d’abonnement, données sur l’appareil, export JSON. Thème clair, sombre ou système. Installable et utilisable hors ligne.

## Développement

Node 24. Vite, TypeScript strict, Preact (voir `docs/adr/0001-pile-technique.md`).

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
- [Specs des fonctionnalités](docs/specs/)
- [Consignes pour les agents et les contributeurs](AGENTS.md)
