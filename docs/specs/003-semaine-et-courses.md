# 003 : semaine et courses

- Statut : **livrée** le 25 novembre 2026 (validée par délégation : objectif « livrer l’application en suivant le plan et les décisions prises »)
- Lot : 2 (voir `docs/PLAN.md`, section 10)

## Contexte

Les recettes existent (lot 1). Il faut maintenant préparer une fournée : choisir les plats et leurs portions, répartir les repas de la semaine qui suit la session, être prévenu des problèmes de conservation, puis faire les courses avec une liste regroupée.

## Ce qui est livré

1. **Fournée courante** (table `fournees`, schéma Dexie v2) : date et heure de la session (prochain dimanche à 14 h par défaut), recettes et portions, 14 repas (midi et soir des 7 jours qui suivent la session), articles cochés.
2. **Réglages** : foyer (2 personnes par défaut ; 1 repas = 1 portion par personne), placard (sel, poivre, huiles, épices et herbes sèches par défaut).
3. **Choisir un plat** (depuis Semaine ou depuis la fiche d’une recette) : le nombre de portions est **demandé**, 4 proposé ; un plat déjà présent voit ses portions mises à jour.
4. **Mise à l’échelle** des quantités (`src/domaine/portions.ts`) : fractions lisibles (½, ¼, ¾), grammes arrondis, boîtes et sachets arrondis à l’unité supérieure, noms accordés (« 2 oignons »).
5. **Repas de la semaine** : un sélecteur par repas (libre ou un plat de la fournée) et « Répartir automatiquement » : les plats qui se gardent le moins au frigo d’abord, sans dépasser leurs portions, sans deux fois le même plat d’affilée quand c’est possible.
6. **À surveiller** : repas prévu au-delà de la conservation au frigo (à congeler le jour de la session et à sortir la veille au soir si le plat se congèle, sinon à avancer), plus de repas prévus que de portions, étapes à faire la veille de la session.
7. **Courses** : liste consolidée par rayon, une ligne par ingrédient (unités compatibles additionnées : g et kg, ml, cl et l), détail par recette, sous-recettes développées (la lasagne ajoute la bolognaise), basiques du placard à part (« J’en ai » ou « À acheter »), articles cochés gardés, « Masquer les articles cochés », partage en texte (partage du téléphone ou copie).

## Critères d’acceptation

- [x] Ajouter le chili depuis Semaine demande les portions (4 proposé) ; 8 portions doublent les quantités dans les courses.
- [x] Chili et bolognaise ensemble : une seule ligne « bœuf haché » de 1 kg, détaillée par recette ; la lasagne ajoute les ingrédients de la bolognaise.
- [x] « Répartir automatiquement » pour 2 personnes avec 4 plats de 4 portions couvre 8 repas ; un plat ne dépasse jamais ses portions.
- [x] Un repas de gratin prévu 4 jours après la session déclenche « à congeler » ; l’omelette normande (2 jours, ne se congèle pas) prévue à J+4 déclenche « à avancer ».
- [x] La brandade dans la fournée rappelle de dessaler la morue la veille.
- [x] Courses : cocher, recharger, l’article reste coché ; « J’en ai » envoie au placard ; les basiques n’apparaissent qu’au placard.
- [x] Semaine et Courses : 5 tailles × 2 thèmes sans débordement ni violation axe ; tout se fait au clavier.
- [x] Tests unitaires : dates, mise à l’échelle, consolidation, répartition, alertes.

## Hors périmètre

Ordonnancement de la session (lot 3), plats du stock dans le planning et rappels de décongélation (lot 4), partage de la fournée et statistiques (lot 5).
