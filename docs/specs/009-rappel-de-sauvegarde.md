# 009 : rappel de sauvegarde

- Statut : **livrée** le 26 novembre 2026 (validée par délégation : demande de l’utilisateur du même jour, « rattrape la documentation et les risques techniques » ; le risque visé est la perte des recettes)
- Lot : 8 (voir `docs/PLAN.md`, section 10)

## Contexte

Tout reste sur l’appareil : pas de compte, pas de serveur. Le navigateur peut effacer les données d’un site (sur iPhone, après 7 jours sans visite si Fournée n’est pas installée), un téléphone se perd ou se remplace. L’export (Recettes, « Exporter ») existait, mais rien ne rappelait de s’en servir. Les recettes de famille sont les seules données irremplaçables : c’est elles que le rappel protège.

L’export ne contient que les recettes et leurs photos (format `fournee-export`, version 1) : ni la semaine, ni le frigo, ni les réglages, ni les adresses. Une sauvegarde complète demanderait une nouvelle version du format (hors périmètre, voir plus bas).

## Ce qui est livré

1. **Date de la dernière sauvegarde** : chaque export complet (Recettes, « Exporter », ou « Exporter maintenant » du rappel) note sa date sur l’appareil (table `reglages`, clé `sauvegarde` ; pas de nouvelle version du schéma).
2. **Recettes à sauvegarder** : créées ou modifiées après la dernière sauvegarde (toutes s’il n’y en a jamais eu), sauf les recettes de départ jamais modifiées, qui se réinstallent.
3. **Rappel** dans Semaine (sous « Ce soir ») et dans Recettes : « 2 recettes ne sont pas sauvegardées », la date de la dernière sauvegarde (ou « Aucune sauvegarde pour l’instant »), puis « Exporter maintenant » et « Plus tard ». Il n’apparaît que si la plus ancienne modification non sauvegardée a au moins 7 jours : on ne relance pas quelqu’un qui vient d’écrire une recette.
4. **Plus tard** : plus de rappel pendant 7 jours. Un export efface le report.
5. Le rappel est chargé avec les écrans Semaine et Recettes : rien de plus au démarrage.

## Critères d’acceptation

- [x] Aucune recette personnelle : pas de rappel. Une recette de départ modifiée compte, une recette de départ intacte non.
- [x] Une recette personnelle créée il y a moins de 7 jours : pas de rappel ; 7 jours ou plus : rappel avec le nombre de recettes et la date de la dernière sauvegarde.
- [x] Après un export, les recettes antérieures ne comptent plus ; une recette modifiée ensuite compte de nouveau.
- [x] « Plus tard » masque le rappel 7 jours, rechargement compris ; il revient ensuite.
- [x] « Exporter maintenant » télécharge le même fichier que « Exporter » et fait disparaître le rappel, rechargement compris.
- [x] Une valeur illisible dans la base est ignorée (rappel comme sans sauvegarde), sans erreur.
- [x] Rappel affiché à 360 px : pas de débordement, aucune violation axe, en clair et en sombre.
- [x] Budget de démarrage inchangé.

Vérification : `tests/domaine/sauvegarde.test.ts`, `tests/donnees/sauvegarde.test.ts`, `tests/e2e/sauvegarde.spec.ts`.

## Hors périmètre

Sauvegarde complète (semaine, frigo, réglages, adresses : nouvelle version du format d’export et un ADR) ; sauvegarde automatique vers un dossier ou un nuage (pas d’API fiable sur iPhone) ; savoir si le fichier téléchargé a bien été gardé (le navigateur ne le dit pas) ; recettes importées d’un fichier, qui comptent comme non sauvegardées sur ce nouvel appareil tant qu’on n’a pas exporté.

## Notes techniques

`src/domaine/sauvegarde.ts` (règles, pures), `src/donnees/sauvegarde.ts` (lecture et écriture), `src/app/sauvegarde-etat.ts` (signal, export, report), `src/app/RappelSauvegarde.tsx` (bandeau, partagé par Semaine et Recettes).
