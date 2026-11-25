# 005 : frigo

- Statut : **validée par délégation** (objectif du 25 novembre 2026 : livrer l’application en suivant le plan et les décisions prises)
- Lot : 4 (voir `docs/PLAN.md`, sections 2, 8 et 10)

## Contexte

En fin de session, les plats entrent au frigo ou au congélateur (lot 3). Il faut maintenant les suivre jusqu’à l’assiette, et finir ce qui reste dans le frigo sans gaspiller.

## Ce qui est livré

1. **Plats préparés** (onglet « Plats préparés ») : tout, frigo ou congélateur ; jours restants, barre de fraîcheur, alertes (date dépassée, à manger aujourd’hui, bientôt) ; « Manger 1 portion » (annulable), « Congeler » (nouvelle limite : mois de congélation de la recette, 3 par défaut), « Décongeler » (nombre de portions demandé ; au frigo, à manger sous 24 h), « Retirer » (annulable), « Ajouter un plat » hors session (restes, plat acheté, recette de la bibliothèque ou nom libre).
2. **Planning** : un repas de la semaine peut prendre un plat du stock (frigo ou congélateur).
3. **Rappels de décongélation** : la veille au soir de chaque repas servi par un plat du congélateur (choisi dans le planning, ou portions congelées en fin de session pour un repas tardif).
4. **Ce qu’il reste** (onglet) : ingrédients restants (saisis comme on parle : « ½ courgette », quantité lue), « à finir vite », restes probables d’après les courses de la dernière session (« ½ botte de coriandre »).
5. **Idées** : recettes de la bibliothèque et petit catalogue anti-gaspi, classées par ingrédients utilisés, ingrédients « à finir vite » sauvés et ingrédients manquants (quantités comprises : 3 œufs ne suffisent pas pour une frittata de 6) ; basiques du placard supposés présents. Une idée du catalogue s’ajoute à la bibliothèque d’un geste ; une recette s’ajoute à la fournée (portions demandées).
6. **Mini-session anti-gaspi** : la paire d’idées sans achat qui finit le plus d’ingrédients urgents ; « Cuisiner les deux » les met dans la fournée (portions demandées) et ouvre la session.

## Critères d’acceptation

- [ ] Fin de session : les plats apparaissent au frigo avec la bonne date limite ; les portions des repas tardifs sont au congélateur.
- [ ] Manger la dernière portion retire le plat ; « Annuler » le remet. Congeler change de lieu et de limite ; décongeler 2 portions sur 4 laisse 2 portions au congélateur et crée un plat au frigo à manger sous 24 h.
- [ ] Un plat à la date du jour déclenche l’alerte « à manger aujourd’hui » ; une date dépassée est signalée.
- [ ] Un repas servi par un plat du congélateur produit le rappel « sortir … la veille au soir ».
- [ ] « Ce qu’il reste » : retirer un ingrédient met les idées à jour ; une idée sans achat porte « Rien à acheter » ; ajouter une idée du catalogue crée une recette structurée dans la bibliothèque.
- [ ] Tests unitaires : fraîcheur et alertes, congeler et décongeler, rappels, restes probables, idées et mini-session.
- [ ] Frigo (deux onglets) : 5 tailles × 2 thèmes sans débordement ni violation axe.

## Hors périmètre

Code-barres, dates de péremption des ingrédients achetés, synchronisation entre appareils.
