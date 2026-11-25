# ADR 0002 : reconnaissance de texte sur photo reportée

- Statut : **accepté**
- Date : 2026-11-26

## Contexte

Le plan (lot 5) mentionne la reconnaissance de texte sur la photo d’une fiche manuscrite. La seule solution sans serveur est Tesseract.js : moteur WebAssembly et données de la langue française, plusieurs mégaoctets à télécharger et à garder hors ligne. Sur une écriture manuscrite, la reconnaissance est de plus peu fiable.

## Décision

Ne pas l’intégrer pour l’instant. La photo de la fiche est gardée avec la recette (lot 1) ; on tape ou on dicte le texte (la dictée du clavier du téléphone fonctionne dans le champ « telle qu’on la raconte »), puis « Proposer les étapes » structure le texte.

## Conséquences

- Pas de dépendance lourde : le démarrage reste sous 60 ko de JavaScript, tout fonctionne hors ligne.
- À reconsidérer si une reconnaissance manuscrite fiable et légère tourne dans le navigateur, chargée à la demande et seulement dans l’éditeur.
