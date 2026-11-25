# 007 : ce soir, plan B et session à plusieurs

- Statut : **livrée** le 26 novembre 2026 (validée par délégation : demande détaillée de l’utilisateur du même jour ; choix techniques faits en suivant le plan et les décisions prises)
- Lot : 6 (après la version 1)

## Contexte

Demandes de l’utilisateur : un widget « ce soir » en page d’accueil avec une notification pour le dîner ; une solution de repli avec les adresses où l’on aime aller chercher à manger (Burger King, Gino Pizza, Indi Kitch) et un bouton pour en ajouter ; une roulette pour décider au hasard ; des recettes du soir (one pot pasta, salade composée, baguettes garnies, pâtes carbonara à la crème fraîche, soupe fajitas, croque-monsieur…) ; une session à plusieurs, avec les prénoms et la répartition des tâches ; des gestes d’hygiène (légumes avant la viande sur la planche, mains lavées) ; la vaisselle ou le lave-vaisselle et le nettoyage du plan de travail, avec leurs durées.

## Ce qui est livré

1. **Widget « Ce soir »** en tête de l’écran d’accueil (Semaine) : le dîner prévu ce soir (plat de la fournée, plat du stock ou recette du soir) et ce qu’il faut faire (réchauffer, le sortir du congélateur, le cuisiner), sinon « Rien de prévu » et le plan B (roulette, nos adresses) ; aperçu du lendemain soir. Raccourcis de l’icône de l’application (Ce soir, Courses, Session, Ce qu’il reste).
2. **Notification du dîner** à l’heure choisie (19 h 30 par défaut) quand l’application est ouverte ou en arrière-plan, et **rappels dans l’agenda** (fichier `.ics` : dîners à venir et sorties du congélateur, avec alarme) : la voie fiable sur iPhone (ADR 0003).
3. **Plan B, nos adresses** : Burger King, Gino Pizza, Indi Kitch au départ (installées une fois : une adresse supprimée ne revient pas) ; ajouter, modifier, supprimer une adresse (nom, type, adresse, téléphone, site) ; appeler, itinéraire, site ; « Ce soir » sur une adresse la retient pour le dîner.
4. **Roulette** : tirage uniforme (hasard cryptographique du navigateur) parmi les recettes du soir et les adresses, ou seulement l’un des deux ; animation courte, supprimée si l’utilisateur limite les animations ; « Ce soir, c’est ça » retient le choix pour le dîner du jour (recette ou adresse), avant le planning ; « Changer d’avis » l’oublie.
5. **Recettes du soir** (à cuisiner le jour même, hors session) : 7 recettes de départ ; filtre « Du soir » ; case « Recette du soir » dans l’éditeur ; au planning dans un groupe à part ; leurs ingrédients rejoignent les courses (une portion par personne du foyer et par repas) ; pas d’alerte de conservation. Une recette du soir ajoutée à la fournée suit la fournée.
6. **Session à plusieurs** : « Qui cuisine ? » (prénoms, 4 personnes au plus, gardés dans les réglages) ; l’ordonnanceur répartit les tâches actives et donne chaque nouvelle tâche à la personne libre **qui a le moins travaillé** (charge partagée) ; « Maintenant » et « Ensuite » avec le prénom, frise par personne, carte « Qui fait quoi » (étapes et temps de travail de chacun).
7. **Hygiène et ménage dans le déroulé** :
   - au début, tout le monde se lave les mains et sort planches, couteaux et contenants (3 min) ;
   - **légumes avant la viande crue** sur la planche ; la découpe de viande ou de poisson crus se termine par « puis laver la planche et le couteau, se laver les mains » (2 min de plus, **par la même personne**) ;
   - après les préparations : charger le lave-vaisselle (5 min) ou faire la vaisselle (15 min) ;
   - pendant le refroidissement : lancer le lave-vaisselle ou finir la vaisselle, nettoyer le plan de travail, les feux et l’évier (12 min avec lave-vaisselle, 25 min sans) ;
   - à la fin : portionner, étiqueter (nom, date) et ranger (2 min par plat, 5 min au moins).

   Case « Lave-vaisselle » (cochée par défaut). Les options sont figées au lancement de la session ; une session lancée avant ce lot continue sans ces étapes.

## Choix faits en livrant

- Le choix de dernière minute (roulette, adresse) est gardé dans les réglages pour le jour dit, et non dans le planning : les fournées ne couvrent pas toujours aujourd’hui (la semaine en préparation commence le lundi suivant la session), et une adresse n’est pas un repas de la fournée.
- Le lavage de la planche après la viande crue fait partie de la découpe au lieu d’être une étape à part : sinon l’ordonnanceur pouvait la confier à une autre personne.
- Les adresses restent sur l’appareil et ne sont pas dans l’export de la bibliothèque (qui ne contient que des recettes).
- Schéma de la base en version 3 : table des adresses ; les recettes existantes deviennent « pas du soir ».

## Critères d’acceptation

- [x] Le widget affiche le dîner de ce soir selon le planning (fournée en cours ou semaine de la dernière session) et le plan B quand rien n’est prévu.
- [x] La roulette tire uniformément parmi les options retenues (test avec un hasard injecté) ; « Ce soir, c’est ça » retient le choix pour le dîner du jour.
- [x] Ajouter une adresse la garde après rechargement ; les trois adresses de départ sont installées une seule fois.
- [x] Le fichier `.ics` contient un événement par dîner prévu et par sortie du congélateur, avec alarme, au bon jour et à la bonne heure.
- [x] Une recette du soir prévue deux soirs pour 2 personnes ajoute 4 portions de ses ingrédients aux courses, n’entre pas dans la session et ne déclenche pas d’alerte de conservation.
- [x] Avec la soupe fajitas, la découpe des légumes passe avant celle du poulet cru, suivie du nettoyage de la planche ; le déroulé commence par le lavage des mains et finit par le rangement ; vaisselle et nettoyage figurent avec leurs durées (avec ou sans lave-vaisselle).
- [x] Avec deux participants, chaque tâche active porte un prénom ; aucune personne n’a deux tâches actives à la fois (propriétés de l’ordonnanceur toujours vérifiées, hygiène comprise).
- [x] Écrans touchés : sans débordement ni violation axe (session : 5 tailles × 2 thèmes ; widget et roulette : 360 et 1280 px × 2 thèmes ; adresses).

## Hors périmètre

Widgets du système (écran d’accueil du téléphone) : une application web ne peut pas en créer sur iPhone ; notifications envoyées par un serveur (Web Push) : pas de serveur ; commande en ligne auprès des restaurants.
