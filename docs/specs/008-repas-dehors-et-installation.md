# 008 : repas à l’extérieur et installation de l’application

- Statut : **livrée** le 26 novembre 2026 (validée par délégation : demande de l’utilisateur du même jour ; choix faits en suivant le plan et les décisions prises)
- Lot : 7

## Contexte

Demandes de l’utilisateur : dans « Repas de la semaine », pouvoir désactiver les midis ou les soirs, pour toute la semaine ou ponctuellement (« soirée resto prévue ») ; un bouton pour installer l’application sur iPhone et sur Android.

## Ce qui est livré

1. **Repas à l’extérieur** : chaque repas peut être « À l’extérieur (resto, invitation…) » au lieu de « Libre ». Il n’attend aucun plat : la répartition automatique le saute, il ne compte pas dans les repas à couvrir (« 8 sur 12 » si deux repas sont à l’extérieur), il n’entre ni dans les courses ni dans les alertes.
2. **Toute la semaine** : deux cases « À la maison cette semaine : Midis, Soirs ». Décocher « Midis » met les 7 midis à l’extérieur (en retirant ce qui y était prévu) ; recocher les remet libres. La case reste cochée tant qu’un midi au moins est à la maison.
3. **Ce soir** : un dîner à l’extérieur s’affiche « Dîner à l’extérieur, rien à cuisiner ce soir » (nos adresses restent à portée) ; pas de rappel du dîner ce soir-là, pas d’événement dans l’agenda ; le lendemain s’annonce « Demain soir : à l’extérieur ». Un choix de dernière minute (roulette, adresse) passe toujours avant.
4. **Installer l’application** : un bouton « Installer » dans le bandeau, tant que Fournée n’est pas installée :
   - Android (Chrome, Brave, Edge, Samsung Internet) et ordinateur (Chrome, Edge) : la fenêtre d’installation du navigateur s’ouvre directement ;
   - iPhone et iPad (Safari, Brave, Chrome, Firefox) : pas d’installation directe possible, une fenêtre explique les trois gestes (Partager, « Sur l’écran d’accueil », Ajouter) et prévient que l’application installée a **son propre stockage** sur iPhone : exporter les recettes depuis le navigateur, puis les importer dans l’application ;
   - Android sans fenêtre d’installation (Firefox, ou fenêtre déjà refusée) : la marche à suivre par le menu du navigateur ;
   - ordinateur sans installation possible (Firefox, Safari) : pas de bouton.

## Choix faits en livrant

- « À l’extérieur » est un drapeau du repas (`dehors`), facultatif : les fournées enregistrées avant restent valables sans migration (absent = à la maison). Pas de nouvelle version du schéma : le champ n’est pas indexé.
- Les cases de la semaine ne gardent pas d’état à part : elles se déduisent des repas (cochée tant qu’un repas de ce moment est à la maison), ce qui évite deux vérités contradictoires.
- Les cases valent pour la semaine affichée : la fournée suivante repart avec tous les repas à la maison.
- L’invitation à installer du navigateur (`beforeinstallprompt`) est captée dès le démarrage. La fenêtre d’explication est chargée avec le bandeau : chargée à la demande, elle forçait un découpage plus lourd des morceaux partagés (59,4 ko au lieu de 59,3 ko au démarrage, pour 60 ko permis).

## Critères d’acceptation

- [x] Un repas mis « À l’extérieur » le reste après rechargement, n’est pas compté dans les repas à couvrir et n’est pas rempli par la répartition automatique.
- [x] Décocher « Midis » met les 7 midis à l’extérieur et retire les plats qui y étaient ; recocher les remet libres.
- [x] Un dîner à l’extérieur ce soir : le widget l’affiche, aucune notification, aucun événement dans l’agenda.
- [x] Le bouton « Installer » ouvre la fenêtre du navigateur quand elle existe ; sur iPhone, il ouvre les explications ; il disparaît une fois l’application installée.
- [x] Écrans touchés sans débordement ni violation axe (360 et 1280 px, clair et sombre) ; budget de démarrage respecté.

## Hors périmètre

Habitudes permanentes (« jamais à la maison le midi ») reprises d’une semaine sur l’autre ; installation silencieuse (impossible sur iPhone) ; partage du stockage entre Safari et l’application installée sur iPhone (décidé par iOS).
