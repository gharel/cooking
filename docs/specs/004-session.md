# 004 : session

- Statut : **validée par délégation** (objectif du 25 novembre 2026 : livrer l’application en suivant le plan et les décisions prises)
- Lot : 3 (voir `docs/PLAN.md`, sections 6 et 10)

## Contexte

C’est la promesse de Fournée : à partir des plats de la fournée, calculer le déroulé de la session (plusieurs recettes menées de front, feux et four partagés), puis guider la session en direct.

## Ce qui est livré

1. **Ordonnanceur** (`src/domaine/ordonnanceur.ts`, fonction pure et déterministe) :
   - tâches tirées des étapes des plats, durées de préparation ajustées aux portions (×2 portions : ×1,5 de temps de préparation ; cuissons inchangées) ;
   - sous-recettes développées (la lasagne inclut les étapes de la bolognaise) ; étapes « la veille » mises à part ;
   - **regroupement** des préparations identiques de recettes différentes (même geste, mêmes ingrédients) : une seule tâche, 75 % du temps cumulé ;
   - ordonnancement par liste avec ressources : cuisiniers (étapes actives), feux, fours (2 plats par four à la même température ; un préchauffage devient inutile si le four est déjà chaud à la bonne température), repos sans limite ; priorité au chemin restant le plus long ;
   - tâches déjà commencées ou terminées figées, rien ne commence avant « maintenant » : c’est ce qui permet le **recalcul en direct**.
2. **Préparer la session** : durée estimée et comparaison avec l’enchaînement recette par recette, équipement (feux, fours, cuisiniers) gardé dans les réglages, « À faire la veille » à cocher, déroulé chronologique (liste lisible au lecteur d’écran) et frise par poste.
3. **Session en direct** : carte « Maintenant » (étape terminée, +5 min, passer une étape facultative), minuteurs des cuissons en cours (compte à rebours, signal sonore, vibration et notification à la fin), « Ensuite », frise avec la ligne « Maintenant », mode cuisine (gros caractères) et écran maintenu allumé.
4. **Fin de session** : bilan (durée réelle, prévue, enchaînement recette par recette), plats rangés au frigo ou au congélateur (les portions prévues au-delà de la conservation au frigo vont au congélateur), nouvelle fournée prête.

## Critères d’acceptation

- [ ] Propriétés vérifiées sur des centaines de cas générés (fast-check) : dépendances respectées, jamais plus de tâches actives que de cuisiniers, de tâches sur le feu que de feux, plus de 2 plats ni deux températures dans un four ; durée au moins égale au chemin critique ; résultat identique à entrée identique ; tâches figées respectées, rien de nouveau avant « maintenant ».
- [ ] Fournée de démonstration (chili, dahl, gratin dauphinois, quiche lorraine, 4 portions, 4 feux, 1 four, 1 cuisinier) : la session tient en moins de 75 % du temps de l’enchaînement recette par recette.
- [ ] Gratin dauphinois et quiche sans pâte (tous deux à 180 °C) partagent le four ; le second préchauffage devient inutile.
- [ ] Lasagne et bolognaise : les étapes de la bolognaise de la lasagne apparaissent, avant le montage.
- [ ] En direct : « Étape terminée » passe à l’étape suivante et recalcule la fin estimée ; un minuteur atteint zéro et l’étape passe en « terminée » ; « Terminer la session » range les plats et affiche le bilan.
- [ ] Session : 5 tailles × 2 thèmes sans débordement de page (la frise défile dans son cadre) ni violation axe.

## Hors périmètre

Deux sessions en parallèle, synchronisation entre appareils, minuteurs en arrière-plan quand le navigateur est fermé (les notifications ne fonctionnent que page ouverte ou en arrière-plan récent).
