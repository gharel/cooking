# 006 : confort

- Statut : **validée par délégation** (objectif du 25 novembre 2026 : livrer l’application en suivant le plan et les décisions prises)
- Lot : 5 (voir `docs/PLAN.md`, section 10)

## Contexte

Les quatre écrans fonctionnent. Ce lot ajoute ce qui rend l’application agréable à vivre : voir le temps gagné, récupérer une recette trouvée sur le web, partager une recette de famille ou la fournée, imprimer une fiche.

## Ce qui est livré

1. **Statistiques** (Semaine, « Vos fournées ») : sessions terminées, temps gagné cumulé (enchaînement recette par recette moins durée réelle), portions et plats cuisinés, durée moyenne d’une session.
2. **Import depuis une page web** : on colle le code de la page (ou le seul bloc JSON-LD) d’une recette ; Fournée lit le balisage schema.org `Recipe` (nom, portions, ingrédients, instructions, même en sections) et ouvre l’éditeur prérempli (origine « Du web », adresse gardée). Sans balisage, le texte collé est découpé en titre, ingrédients et instructions. Le navigateur ne peut pas lire une autre page directement (CORS) : c’est pourquoi on colle.
3. **Recevoir un partage** (Android) : l’application installée apparaît dans le menu « Partager » ; le texte ou le lien partagés ouvrent l’import.
4. **Partager une recette** (fiche) : un fichier Fournée de la recette, photos et sous-recettes comprises, envoyé par le menu de partage du téléphone (ou téléchargé) ; il s’importe tel quel dans la bibliothèque d’un proche. **Imprimer** la fiche (mise en page sans navigation).
5. **Partager la fournée** (Semaine) : plats, portions et repas de la semaine, en texte.
6. **Quantités dans les idées** : déjà livré avec le lot 4.
7. **Reconnaissance de texte sur photo** : reportée (ADR 0002).

## Critères d’acceptation

- [ ] Statistiques justes après deux sessions (tests unitaires) et affichées dans Semaine.
- [ ] Une page contenant un JSON-LD `Recipe` (instructions en `HowToStep` ou en sections) donne nom, portions, ingrédients et instructions ; un `@graph` est parcouru ; un texte sans balisage donne titre, ingrédients et instructions.
- [ ] Coller une page dans « Depuis une page web » ouvre l’éditeur prérempli ; enregistrer crée une recette « Du web » avec son adresse.
- [ ] Partager une recette produit un fichier qui, importé dans un navigateur vierge, redonne la recette (et sa sous-recette).
- [ ] Le texte de la fournée liste les plats, les portions et les repas prévus.
- [ ] Une adresse `?texte=…` (partage reçu) ouvre l’import prérempli.
- [ ] Écrans touchés : 5 tailles × 2 thèmes sans débordement ni violation axe.

## Hors périmètre

Lecture directe d’une adresse web (impossible sans serveur relais), reconnaissance de texte sur photo, synchronisation entre appareils.
