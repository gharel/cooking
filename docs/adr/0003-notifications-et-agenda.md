# ADR 0003 : notification du dîner, sans serveur

- Statut : **accepté**
- Date : 2026-11-26

## Contexte

L’utilisateur veut être prévenu de la recette du soir. Une application web ne peut pas programmer une notification à une heure donnée quand elle est fermée : il faut soit un serveur qui envoie une notification push (Web Push, avec abonnement et clés), soit des API expérimentales absentes de Safari (déclencheurs de notifications, synchronisation périodique). L’utilisateur se sert d’un iPhone. Fournée est locale d’abord, sans serveur ni compte.

## Décision

1. **Notification locale** à l’heure du dîner tant que l’application est ouverte ou en arrière-plan récent (minuterie dans la page, affichage par le service worker quand il est là).
2. **Rappels dans l’agenda** : un fichier `.ics` des dîners de la semaine et des sorties du congélateur, chaque événement avec une alarme. L’agenda du téléphone notifie de façon fiable, application fermée, sans serveur.
3. Pas de Web Push pour l’instant.

## Conséquences

- Aucune donnée ne quitte l’appareil.
- La notification « application fermée » passe par l’agenda ; à reconsidérer si un serveur de notifications devient acceptable.
- Les widgets du système (écran d’accueil du téléphone) restent hors de portée d’une application web sur iPhone : le widget « Ce soir » est en tête de l’écran d’accueil de l’application, et l’icône propose des raccourcis.
