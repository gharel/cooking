# Fournée

Application web de batch cooking : vos recettes (y compris celles de la famille), une session de cuisine orchestrée, un frigo sous contrôle.

> **Statut : cadrage validé, développement à venir.** La maquette est en ligne : https://gharel.github.io/cooking/ (données fictives). Nom de travail : « Fournée ».

## Ce que fait l’application

| Écran    | Rôle                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| Semaine  | Recettes de la fournée, portions, répartition des repas, alertes de conservation                                      |
| Courses  | Liste consolidée par rayon (les oignons de toutes les recettes sur une ligne), placard, hors ligne                    |
| Session  | Déroulé calculé par poste (plan de travail, feux, four, refroidissement), minuteurs, mode cuisine                     |
| Frigo    | Plats préparés avec dates limites et rappels ; « Ce qu’il reste » : idées et mini-session anti-gaspi                  |
| Recettes | Bibliothèque aux étapes structurées ; recettes de famille ou maison saisies comme on les raconte, texte d’origine gardé |

Locale d’abord : pas de compte, pas d’abonnement, données sur l’appareil, export JSON. Thème clair, sombre ou système.

## Voir la maquette

En ligne : https://gharel.github.io/cooking/, ou ouvrir `maquette/index.html` dans un navigateur (fichier autonome). Les boutons non branchés affichent ce qu’ils feraient.

## Documentation

- [Plan produit et technique](docs/PLAN.md)
- [Analyse des applications existantes](docs/BENCHMARK.md)
- [Décisions d’architecture](docs/adr/)
- [Specs des fonctionnalités](docs/specs/)
- [Consignes pour les agents et les contributeurs](AGENTS.md)
