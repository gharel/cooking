# Annexe 002 : les recettes de départ

> Fichier **généré** à partir de `src/donnees/recettes-de-depart.ts` par `npm run annexe` : ne pas le modifier à la main. Un test vérifie qu’il est à jour.

- Quantités et étapes vérifiées le 25 novembre 2026 (sources en fin de document).
- 13 recettes de session et 8 recettes du soir (lot 6 : à cuisiner le jour même, hors session).
- Toutes les recettes sont pour **4 portions** ; le nombre de portions se choisit au moment de prendre un plat.

Lecture des étapes : texte · poste · actif ou passif · durée · dépendances. « Actif » occupe le cuisinier ; « passif » n’occupe que le poste (feu, four, repos). Durées « actif » et « total » calculées par `src/domaine/durees.ts` : « total » va jusqu’au plat prêt avec un seul cuisinier, sans le refroidissement final, les étapes facultatives ni ce qui se fait la veille.

## Vue d’ensemble

| Recette                       | Actif  | Total               | Congelable  | Végétarien | Four |
| ----------------------------- | ------ | ------------------- | ----------- | ---------- | ---- |
| Dahl de lentilles             | 15 min | 40 min              | oui, 3 mois | oui        |      |
| Ratatouille                   | 32 min | 1 h 12              | oui, 3 mois | oui        |      |
| Bolognaise                    | 24 min | 1 h 09              | oui, 3 mois |            |      |
| Chili con carne               | 24 min | 1 h 02              | oui, 3 mois |            |      |
| Riz cantonais                 | 20 min | 52 min              | oui, 1 mois |            |      |
| Gratin dauphinois             | 27 min | 1 h 22              | oui, 2 mois | oui        | oui  |
| Tian de légumes corse         | 36 min | 1 h 21              | oui, 3 mois |            | oui  |
| Lasagne                       | 22 min | 1 h 02 + bolognaise | oui, 3 mois |            | oui  |
| Gratin d’aubergines à la feta | 18 min | 1 h 06              | oui, 2 mois | oui        | oui  |
| Quiche sans pâte              | 13 min | 55 min              | oui, 2 mois |            | oui  |
| Quiche lorraine               | 15 min | 57 min              | oui, 2 mois |            | oui  |
| Omelette normande             | 29 min | 36 min              | non         |            |      |
| Brandade de morue             | 26 min | 43 min + la veille  | oui, 3 mois |            | oui  |

Filtres attendus (recettes de session) : Végétarien 4, Four 7, Congelable 12, 15 min actives ou moins 3.

## Recettes du soir

| Recette du soir   | Actif  | Total  | Végétarien | Four |
| ----------------- | ------ | ------ | ---------- | ---- |
| One pot pasta     | 21 min | 21 min | oui        |      |
| Salade composée   | 18 min | 18 min |            |      |
| Baguettes garnies | 15 min | 15 min |            |      |
| Pâtes carbonara   | 12 min | 23 min |            |      |
| Soupe aux légumes | 27 min | 52 min | oui        |      |
| Fajitas au poulet | 36 min | 36 min |            |      |
| Croque-monsieur   | 10 min | 20 min |            | oui  |
| Wraps au poulet   | 25 min | 25 min |            |      |

## Dahl de lentilles

4 portions · frigo 3 jours · congélateur 3 mois

> Coriandre fraîche à ajouter au moment de servir si le dahl a été congelé.

- 250 g de lentilles corail
- 1 oignon
- 2 gousses d’ail
- 3 cm de gingembre frais
- 1 boîte de tomates concassées (400 g)
- 40 cl de lait de coco
- 50 cl de bouillon de légumes
- 2 c. à c. de curry
- 1 c. à c. de curcuma
- 1 c. à c. de cumin
- 2 c. à s. d’huile
- 1 citron vert
- ½ botte de coriandre

1. Émincer l’oignon, l’ail et le gingembre · plan de travail · actif · 6 min
2. Rincer les lentilles · plan de travail · actif · 2 min
3. Faire revenir oignon, ail, gingembre et épices dans l’huile · feu · actif · 5 min · après 1
4. Ajouter lentilles, tomates, lait de coco et bouillon ; mijoter en remuant de temps en temps · feu · passif · 25 min · après 2 et 3
5. Ajouter le jus du citron et la coriandre · plan de travail · actif · 2 min · après 4
6. Laisser refroidir avant de portionner · repos · passif · 30 min · après 5

## Ratatouille

4 portions · frigo 3 jours · congélateur 3 mois

- 1 grosse aubergine
- 2 courgettes
- 2 poivrons (1 rouge, 1 jaune)
- 1 gros oignon
- 2 gousses d’ail
- 1 boîte de tomates concassées (400 g)
- 1 c. à s. d’herbes de Provence
- 3 c. à s. d’huile d’olive
- sel
- poivre

1. Couper l’aubergine, les courgettes et les poivrons en dés · plan de travail · actif · 12 min
2. Émincer l’oignon et l’ail · plan de travail · actif · 5 min
3. Faire revenir l’oignon dans l’huile · feu · actif · 5 min · après 2
4. Ajouter l’aubergine et les poivrons, faire dorer · feu · actif · 10 min · après 1 et 3
5. Ajouter les courgettes, les tomates, l’ail et les herbes ; mijoter à couvert · feu · passif · 40 min · après 4
6. Laisser refroidir avant de portionner · repos · passif · 30 min · après 5

## Bolognaise

4 portions · frigo 3 jours · congélateur 3 mois

> Sert aussi de sauce à la lasagne.

- 500 g de bœuf haché
- 1 oignon
- 1 carotte
- 1 branche de céleri
- 2 gousses d’ail
- 1 boîte de tomates concassées (800 g)
- 2 c. à s. de concentré de tomate
- 10 cl de vin rouge (facultatif)
- 1 feuille de laurier
- 1 c. à c. de thym
- 2 c. à s. d’huile d’olive
- sel
- poivre

1. Hacher finement l’oignon, la carotte, le céleri et l’ail · plan de travail · actif · 10 min
2. Faire revenir les légumes hachés dans l’huile · feu · actif · 6 min · après 1
3. Ajouter le bœuf et le faire dorer · feu · actif · 8 min · après 2
4. Ajouter le concentré, le vin, les tomates et les herbes ; mijoter à couvert · feu · passif · 45 min · après 3
5. Laisser refroidir avant de portionner · repos · passif · 30 min · après 4

## Chili con carne

4 portions · frigo 3 jours · congélateur 3 mois

- 500 g de bœuf haché
- 1 oignon
- 2 gousses d’ail
- 1 poivron rouge
- 1 boîte de tomates concassées (400 g)
- 1 c. à s. de concentré de tomate
- 1 boîte de haricots rouges (400 g)
- 1 c. à c. de cumin
- 1 c. à c. de paprika
- ½ c. à c. de piment en poudre (selon le goût)
- 1 carré de chocolat noir (facultatif)
- 2 c. à s. d’huile
- sel

1. Émincer l’oignon et l’ail, couper le poivron · plan de travail · actif · 8 min
2. Faire revenir l’oignon, l’ail et le poivron dans l’huile · feu · actif · 6 min · après 1
3. Ajouter le bœuf et les épices, faire dorer · feu · actif · 8 min · après 2
4. Ajouter les tomates et le concentré ; mijoter à couvert · feu · passif · 25 min · après 3
5. Rincer et égoutter les haricots · plan de travail · actif · 2 min
6. Ajouter les haricots et le chocolat ; mijoter encore · feu · passif · 15 min · après 4 et 5
7. Laisser refroidir avant de portionner · repos · passif · 30 min · après 6

## Riz cantonais

4 portions · frigo 2 jours · congélateur 1 mois

> Le riz cuit doit refroidir vite et se garde peu : 2 jours au frigo au plus.

- 300 g de riz long
- 3 œufs
- 150 g de jambon blanc
- 150 g de petits pois surgelés
- 2 oignons nouveaux
- 3 c. à s. de sauce soja
- 2 c. à s. d’huile

1. Rincer le riz · plan de travail · actif · 2 min
2. Cuire le riz · feu · passif · 12 min · après 1
3. Étaler le riz et le laisser refroidir (idéalement cuit la veille) · repos · passif · 30 min · après 2
4. Couper le jambon en dés et émincer les oignons nouveaux · plan de travail · actif · 5 min
5. Cuire les œufs battus en omelette fine, puis la couper en lanières · feu · actif · 5 min
6. Faire sauter le riz avec les petits pois, le jambon, l’omelette et la sauce soja · feu · actif · 8 min · après 3 et 4 et 5
7. Refroidir rapidement avant de portionner · repos · passif · 20 min · après 6

## Gratin dauphinois

Pommes de terre et patates douces · 4 portions · frigo 3 jours · congélateur 2 mois

> Se congèle bien ; la texture devient un peu plus fondante.

- 500 g de pommes de terre
- 500 g de patates douces
- 25 cl de crème liquide
- 25 cl de lait
- 1 gousse d’ail
- ½ c. à c. de muscade
- 80 g de gruyère râpé
- 15 g de beurre
- sel
- poivre

1. Préchauffer le four à 180 °C · four · passif · 15 min
2. Éplucher les pommes de terre et les patates douces, les couper en fines rondelles · plan de travail · actif · 15 min
3. Chauffer le lait et la crème avec l’ail écrasé, la muscade, du sel et du poivre · feu · actif · 5 min
4. Beurrer le plat, alterner les rondelles, verser le mélange, parsemer de gruyère · plan de travail · actif · 7 min · après 2 et 3
5. Cuire au four jusqu’à ce que la pointe d’un couteau s’enfonce sans résistance · four · passif · 55 min · après 1 et 4
6. Laisser refroidir avant de portionner · repos · passif · 30 min · après 5

## Tian de légumes corse

En couches comme une lasagne · 4 portions · frigo 3 jours · congélateur 3 mois

- 300 g de chair à saucisse
- 6 feuilles de lasagne
- 2 courgettes
- 3 tomates
- 1 oignon
- 1 gousse d’ail
- ½ botte de basilic
- ½ c. à c. de muscade
- 80 g de gruyère râpé
- 2 c. à s. d’huile d’olive
- sel
- poivre

1. Préchauffer le four à 180 °C · four · passif · 15 min
2. Couper les courgettes et les tomates en fines rondelles, ciseler le basilic · plan de travail · actif · 12 min
3. Émincer l’oignon et l’ail · plan de travail · actif · 4 min
4. Faire revenir la chair à saucisse avec l’oignon et l’ail, ajouter la muscade · feu · actif · 10 min · après 3
5. Monter en couches : feuilles de lasagne, chair à saucisse, courgettes, tomates, basilic ; finir par le gruyère · plan de travail · actif · 10 min · après 2 et 4
6. Cuire au four, couvert les 20 premières minutes · four · passif · 45 min · après 1 et 5
7. Laisser refroidir avant de portionner · repos · passif · 30 min · après 6

## Lasagne

4 portions · frigo 3 jours · congélateur 3 mois

- Bolognaise : 4 portions (voir la recette)
- 9 feuilles de lasagne
- 40 g de beurre
- 40 g de farine
- 50 cl de lait
- ½ c. à c. de muscade
- 80 g de parmesan
- sel
- poivre

1. Préparer la bolognaise, ou en prendre une déjà prête · feu · actif · sous-recette
2. Préchauffer le four à 180 °C · four · passif · 15 min
3. Béchamel : fondre le beurre, ajouter la farine, puis le lait en fouettant, et la muscade · feu · actif · 10 min
4. Monter : bolognaise, béchamel, feuilles ; finir par la béchamel et le parmesan · plan de travail · actif · 12 min · après 1 et 3
5. Cuire au four · four · passif · 40 min · après 2 et 4
6. Laisser refroidir avant de portionner · repos · passif · 30 min · après 5

## Gratin d’aubergines à la feta

4 portions · frigo 3 jours · congélateur 2 mois

- 3 aubergines
- 200 g de feta
- 1 boîte de tomates concassées (400 g)
- 1 oignon
- 2 gousses d’ail
- 1 c. à c. d’origan
- 4 c. à s. d’huile d’olive
- sel
- poivre

1. Préchauffer le four à 200 °C · four · passif · 15 min
2. Couper les aubergines en rondelles et les badigeonner d’huile · plan de travail · actif · 8 min
3. Rôtir les aubergines · four · passif · 20 min · après 1 et 2
4. Émincer l’oignon et l’ail · plan de travail · actif · 4 min
5. Faire revenir l’oignon et l’ail, ajouter les tomates et l’origan ; mijoter · feu · passif · 15 min · après 4
6. Monter : aubergines, sauce, feta émiettée · plan de travail · actif · 6 min · après 3 et 5
7. Gratiner au four · four · passif · 25 min · après 6
8. Laisser refroidir avant de portionner · repos · passif · 30 min · après 7

## Quiche sans pâte

4 portions · frigo 3 jours · congélateur 2 mois

- 3 œufs
- 60 g de farine
- 25 cl de lait
- 20 cl de crème liquide
- 150 g de lardons
- 80 g de gruyère râpé
- 1 pincée de muscade
- poivre

1. Préchauffer le four à 180 °C · four · passif · 15 min
2. Faire dorer les lardons à sec · feu · actif · 5 min
3. Battre les œufs avec la farine, puis le lait, la crème, la muscade et le poivre · plan de travail · actif · 5 min
4. Verser dans le moule beurré avec les lardons et le gruyère · plan de travail · actif · 3 min · après 2 et 3
5. Cuire au four · four · passif · 40 min · après 1 et 4
6. Laisser refroidir avant de portionner · repos · passif · 30 min · après 5

## Quiche lorraine

4 portions · frigo 3 jours · congélateur 2 mois

- 1 pâte brisée
- 200 g de lardons
- 3 œufs
- 20 cl de crème liquide
- 20 cl de lait
- 1 pincée de muscade
- poivre

1. Préchauffer le four à 200 °C · four · passif · 15 min
2. Foncer le moule avec la pâte et la piquer à la fourchette · plan de travail · actif · 4 min
3. Précuire la pâte à blanc · four · passif · 10 min · après 1 et 2
4. Faire dorer les lardons à sec · feu · actif · 5 min
5. Battre les œufs avec la crème, le lait, la muscade et le poivre · plan de travail · actif · 4 min
6. Garnir la pâte de lardons et verser l’appareil · plan de travail · actif · 2 min · après 3 et 4 et 5
7. Cuire au four à 180 °C · four · passif · 30 min · après 6
8. Laisser refroidir avant de portionner · repos · passif · 30 min · après 7

## Omelette normande

Version salée · 4 portions · frigo 2 jours · ne se congèle pas

- 8 œufs
- 500 g de pommes de terre
- 150 g de lardons
- 1 oignon
- ½ camembert
- 10 cl de crème fraîche
- 20 g de beurre
- sel
- poivre

1. Éplucher les pommes de terre et les couper en petits dés · plan de travail · actif · 8 min
2. Faire dorer les pommes de terre au beurre, à couvert, en remuant de temps en temps · feu · passif · 20 min · après 1
3. Émincer l’oignon et couper le camembert en tranches · plan de travail · actif · 4 min
4. Faire revenir les lardons et l’oignon · feu · actif · 6 min · après 3
5. Battre les œufs avec la crème, du sel et du poivre · plan de travail · actif · 3 min
6. Réunir pommes de terre, lardons et oignon, verser les œufs, poser le camembert ; cuire à couvert à feu doux · feu · actif · 8 min · après 2 et 4 et 5
7. Laisser refroidir avant de portionner · repos · passif · 20 min · après 6

## Brandade de morue

4 portions · frigo 2 jours · congélateur 3 mois

> Dessalage au frigo, au moins 24 h, en changeant l’eau 3 ou 4 fois.

- 500 g de morue salée
- 600 g de pommes de terre
- 2 gousses d’ail
- 10 cl d’huile d’olive
- 25 cl de lait
- 1 feuille de laurier
- ½ botte de persil
- poivre
- 30 g de chapelure (facultatif)

1. Dessaler la morue dans l’eau froide, au frigo, en changeant l’eau 3 ou 4 fois · repos · passif · 24 h · **à anticiper la veille**
2. Éplucher les pommes de terre · plan de travail · actif · 8 min
3. Cuire les pommes de terre · feu · passif · 25 min · après 2
4. Pocher la morue dans le lait avec le laurier, sans bouillir · feu · passif · 10 min · après 1
5. Effeuiller la morue en retirant la peau et les arêtes · plan de travail · actif · 8 min · après 4
6. Écraser les pommes de terre et la morue avec l’ail, l’huile et un peu du lait chaud ; ajouter le persil · plan de travail · actif · 10 min · après 3 et 5
7. Parsemer de chapelure et gratiner au four à 200 °C · four · passif · 15 min · après 6 · facultative
8. Laisser refroidir avant de portionner · repos · passif · 30 min · après 7

## One pot pasta

Tomate et basilic · 4 portions · frigo 2 jours · ne se congèle pas

- 350 g de spaghetti
- 1 boîte de tomates concassées (400 g)
- 1 oignon
- 2 gousses d’ail
- 1 l de bouillon de légumes
- ½ botte de basilic
- 50 g de parmesan
- 2 c. à s. d’huile d’olive
- sel
- poivre

1. Émincer l’oignon et l’ail · plan de travail · actif · 5 min
2. Mettre dans une grande casserole les pâtes, les tomates, l’oignon, l’ail, le bouillon et l’huile · plan de travail · actif · 2 min · après 1
3. Cuire à feu moyen en remuant souvent, jusqu’à ce que le liquide soit absorbé · feu · actif · 12 min · après 2
4. Ajouter le basilic ciselé et le parmesan · plan de travail · actif · 2 min · après 3

## Salade composée

Thon, œufs, maïs · 4 portions · frigo 1 jour · ne se congèle pas

- 1 salade verte
- 4 tomates
- 1 concombre
- 4 œufs
- 1 boîte de thon (140 g)
- 1 boîte de maïs doux (285 g)
- 3 c. à s. d’huile d’olive
- 1 c. à s. de vinaigre
- 1 c. à c. de moutarde
- sel
- poivre

1. Cuire les œufs durs · feu · passif · 10 min
2. Laver et couper la salade, les tomates et le concombre · plan de travail · actif · 10 min
3. Écaler les œufs et les couper en quartiers · plan de travail · actif · 3 min · après 1
4. Préparer la vinaigrette : moutarde, vinaigre, huile, sel, poivre · plan de travail · actif · 2 min
5. Assembler la salade avec le thon, le maïs et les œufs ; assaisonner au moment de servir · plan de travail · actif · 3 min · après 2 et 3 et 4

## Baguettes garnies

Jambon, fromage, crudités · 4 portions · frigo 1 jour · ne se congèle pas

- 2 baguettes
- 200 g de jambon blanc
- 150 g d’emmental en tranches
- 2 tomates
- 1 salade verte
- 40 g de beurre
- 8 cornichons

1. Couper les baguettes en deux et les ouvrir · plan de travail · actif · 3 min
2. Laver la salade, couper les tomates en rondelles et les cornichons en lamelles · plan de travail · actif · 5 min
3. Beurrer et garnir : jambon, emmental, tomates, cornichons, salade · plan de travail · actif · 7 min · après 1 et 2

## Pâtes carbonara

À la crème fraîche · 4 portions · frigo 2 jours · ne se congèle pas

- 400 g de spaghetti
- 200 g de lardons
- 20 cl de crème fraîche
- 2 jaunes d’œufs
- 60 g de parmesan
- poivre

1. Porter à ébullition une grande casserole d’eau salée · feu · passif · 10 min
2. Cuire les pâtes · feu · passif · 10 min · après 1
3. Faire dorer les lardons à sec · feu · actif · 6 min
4. Mélanger la crème, les jaunes d’œufs et le parmesan, poivrer · plan de travail · actif · 3 min
5. Égoutter les pâtes, mélanger hors du feu avec les lardons et la crème · plan de travail · actif · 3 min · après 2 et 3 et 4

## Soupe aux légumes

Carottes, poireaux, pommes de terre · 4 portions · frigo 3 jours · congélateur 3 mois

- 4 carottes
- 2 poireaux
- 3 pommes de terre
- 1 courgette
- 1 oignon
- 1,5 l de bouillon de légumes
- 20 g de beurre
- 10 cl de crème fraîche (facultatif)
- sel
- poivre

1. Éplucher et couper en morceaux les carottes, les pommes de terre et la courgette · plan de travail · actif · 12 min
2. Émincer l’oignon et les poireaux · plan de travail · actif · 6 min
3. Faire suer l’oignon et les poireaux dans le beurre · feu · actif · 5 min · après 2
4. Ajouter les autres légumes et le bouillon ; porter à ébullition puis cuire à couvert · feu · passif · 25 min · après 1 et 3
5. Mixer la soupe, ajouter la crème, saler et poivrer · plan de travail · actif · 4 min · après 4

## Fajitas au poulet

Poivrons, oignons, avocat · 4 portions · frigo 1 jour · ne se congèle pas

- 600 g de blancs de poulet
- 3 poivrons (rouge, vert, jaune)
- 2 oignons
- 2 c. à s. d’épices à fajitas
- 3 c. à s. d’huile
- 1 citron vert
- 1 avocat
- 8 galettes de blé
- 20 cl de crème fraîche
- 100 g de fromage râpé

1. Émincer les oignons, couper les poivrons en lanières · plan de travail · actif · 8 min
2. Couper l’avocat en tranches et l’arroser du jus du citron vert · plan de travail · actif · 2 min
3. Couper le poulet en lanières, l’enrober des épices et d’un filet d’huile · plan de travail · actif · 5 min
4. Faire revenir les oignons et les poivrons dans l’huile, à feu vif · feu · actif · 7 min · après 1
5. Ajouter le poulet et le faire dorer · feu · actif · 7 min · après 3 et 4
6. Réchauffer les galettes à la poêle, sans matière grasse · feu · actif · 3 min · après 5
7. Garnir les galettes : poulet et poivrons, crème, fromage, avocat ; rouler · plan de travail · actif · 4 min · après 2 et 6

## Croque-monsieur

4 portions · frigo 1 jour · ne se congèle pas

- 8 tranches de pain de mie
- 4 tranches de jambon blanc
- 4 tranches d’emmental
- 100 g de gruyère râpé
- 40 g de beurre

1. Préchauffer le four à 200 °C · four · passif · 10 min
2. Beurrer les tranches de pain de mie · plan de travail · actif · 4 min
3. Garnir de jambon et d’emmental, refermer, parsemer de gruyère · plan de travail · actif · 6 min · après 2
4. Cuire au four jusqu’à ce que ce soit doré · four · passif · 10 min · après 1 et 3

## Wraps au poulet

4 portions · frigo 1 jour · ne se congèle pas

- 4 galettes de blé
- 300 g de blancs de poulet
- 1 avocat
- 2 tomates
- 1 salade verte
- 10 cl de crème fraîche
- 1 c. à c. d’épices à fajitas
- 1 c. à s. d’huile

1. Laver la salade, couper les tomates et l’avocat · plan de travail · actif · 6 min
2. Couper le poulet en lanières · plan de travail · actif · 5 min
3. Faire dorer le poulet avec les épices · feu · actif · 8 min · après 2
4. Garnir les galettes : crème, salade, tomates, avocat, poulet ; rouler · plan de travail · actif · 6 min · après 1 et 3

## Sources

- [Brandade de morue](https://www.jardiner-malin.fr/recettes/brandade-de-morue.html), Jardiner Malin ; [Recette de la brandade de morue](https://www.routard.com/contenu-dossier/cid139416-recette-de-la-brandade-de-morue.html), Routard : 500 à 600 g de morue et 600 g de pommes de terre pour 4, dessalage de 24 h en changeant l’eau 3 ou 4 fois.
- [Le gratin dauphinois traditionnel](https://www.consoglobe.com/recette-gratin-dauphinois-cg), Consoglobe ; [Gratin de patates douces et pommes de terre](https://ileauxepices.com/blog/2018/03/05/recette-gratin-de-patates-douces-et-pommes-de-terre-aux-epices/wpid16212/), Île aux épices : environ 1 kg de tubercules, 180 °C, 50 à 60 min.
- [La quiche sans pâte](https://www.gralon.net/articles/gastronomie-et-alimentation/alimentation/article-la-quiche-sans-pate---une-recette-facile-10416.htm), Gralon ; [Quiche sans pâte](https://www.vorwerk.com/fr/fr/c/vorwerk/astuces-recettes/blog/thermomix/recettes-quotidien/recette-de-quiche-sans-pate), Vorwerk ; [Quiche sans pâte poireaux et lardons](https://www.demotivateur.fr/food/la-quiche-sans-pate-simple-et-rapide-en-5-etapes-aux-poireaux-et-lardons-47582), Démotivateur : 3 œufs, farine, lait et crème, 30 à 40 min à 180 °C.
- Omelette normande salée : aucune recette de référence trouvée ; proportions d’une omelette de 8 œufs pour 4 et des garnitures normandes courantes (pommes de terre, lardons, camembert, crème). À ajuster après un premier essai.
- Autres recettes (dahl, ratatouille, bolognaise, chili, riz cantonais, tian, lasagne, gratin d’aubergines, quiche lorraine) : proportions courantes des recettes familiales pour 4, temps de cuisson usuels.
