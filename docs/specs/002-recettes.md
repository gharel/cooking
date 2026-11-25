# 002 : recettes

- Statut : **livrée** le 25 novembre 2026
- Lot : 1 (voir `docs/PLAN.md`, section 10)
- Annexe : `docs/specs/002-recettes-de-depart.md` (les 13 recettes de départ), **générée** à partir de `src/donnees/recettes-de-depart.ts` par `npm run annexe` ; un test vérifie qu’elle est à jour

## Contexte

Premier écran réel. Tout le reste (semaine, courses, session, frigo) s’appuie sur des recettes bien structurées : ingrédients avec quantités et rayon, étapes avec poste, durée, caractère actif ou passif et dépendances. Ce lot livre la bibliothèque, la fiche, l’éditeur (y compris les recettes de famille racontées en texte libre), le stockage local et les 13 recettes de départ de la maison.

## Ce qui est livré

1. **Données locales** (`src/donnees/`) : IndexedDB avec Dexie (ADR 0001), base `fournee`, schéma version 1 : tables `recettes`, `photos` (images) et `reglages`.
   - Stockage persistant demandé (`navigator.storage.persist()`). S’il est refusé, un message discret conseille d’installer l’application sur l’écran d’accueil et d’exporter de temps en temps : Safari sur iPhone peut effacer les données d’un site non installé après 7 jours sans visite.
   - **Export** JSON de toute la bibliothèque (photos comprises, encodées) et **import** : version de schéma vérifiée, validation stricte champ par champ ; un fichier invalide est refusé avec un message clair et **rien n’est modifié** ; une recette déjà présente (même identifiant) n’est pas écrasée, elle est signalée et ignorée.
2. **Recettes de départ** : les 13 recettes de l’annexe sont installées au premier lancement, une seule fois. Une recette de départ modifiée ou supprimée le reste (pas de réinstallation silencieuse) ; un bouton « Réinstaller les recettes de départ manquantes » existe dans la bibliothèque.
3. **Bibliothèque** (écran Recettes) : cartes (nom, portions, temps actif et total, étiquettes, origine), recherche insensible aux accents et à la casse, filtres (Famille et maison, Congelable, Végétarien, Four, 15 min actives ou moins), tri alphabétique, état vide.
4. **Fiche recette** (`#recettes/<id>`) : ingrédients, étapes structurées (poste, actif ou passif, durée, « après l’étape n », facultative, à anticiper), conservation, origine avec le petit mot et la photo de la fiche, texte d’origine tel que saisi. Actions : Modifier, Dupliquer, Supprimer (confirmation, puis « Annuler » pendant 10 s). Une sous-recette (la lasagne utilise la bolognaise) est un lien vers sa fiche.
5. **Éditeur** (création et modification ; plein écran sur téléphone ; chargé à la demande pour ne pas alourdir le démarrage) :
   - nom, origine (de la famille, notre recette, du web, d’un livre), « de qui », son petit mot, portions ;
   - **texte libre « telle qu’on la raconte »**, gardé à l’identique, et « Proposer les étapes » (analyseur local, voir 6) ;
   - ingrédients (quantité, unité, nom, rayon proposé, facultatif, ou renvoi vers une autre recette) ;
   - étapes (texte, poste, durée, actif ou passif, dépendances, facultative, à anticiper avec son délai : « la veille ») ; une durée devinée reste signalée tant qu’elle n’est pas confirmée ;
   - conservation (jours au frigo ; mois au congélateur ou « ne se congèle pas »), étiquettes ;
   - photo de la fiche (appareil photo ou fichier), réduite à 1600 px de côté au plus, JPEG ;
   - nom obligatoire ; une recette sans étapes structurées est acceptée et marquée « à structurer » ;
   - fermer avec des changements non enregistrés demande confirmation (Échap compris).
6. **Analyseurs** (`src/domaine/`, fonctions pures) :
   - `ingredients.ts` : « 500 g de bœuf haché », « 2 oignons », « 1 c. à s. de curry », « ½ botte de persil », « sel, poivre », « 1 boîte de tomates concassées (400 g) » vers quantité, unité, nom, clé et rayon ;
   - `structuration.ts` : règles du plan (section 7) : découpage en étapes, durées lues ou devinées (signalées), postes et caractère actif d’après le verbe, « pendant ce temps » pour le parallèle, « la veille » pour l’anticipation ;
   - `dictionnaire.ts` : clés, rayons et synonymes des ingrédients, couvrant au moins ceux des recettes de départ.

## Critères d’acceptation

- [x] Premier lancement : les 13 recettes de départ apparaissent ; rechargement : aucun doublon ; une recette de départ supprimée ne revient pas au rechargement, mais revient avec « Réinstaller les recettes de départ manquantes ».
- [x] Recherche « gratin » : 2 résultats ; « legumes » trouve le tian de légumes corse (accents ignorés) ; filtres conformes au tableau de l’annexe (Végétarien : 4, Four : 7, Congelable : 12, 15 min actives ou moins : 3).
- [x] Recette de famille : saisir le texte du hachis de la maquette, « Proposer les étapes » donne 5 étapes dont 1 en parallèle (« pendant ce temps »), 3 durées devinées signalées et 7 ingrédients reconnus ; après enregistrement et rechargement, tout est là et le texte d’origine est identique au caractère près.
- [x] Brandade : l’étape « dessaler la morue » est reconnue « à anticiper, la veille » ; riz cantonais : le refroidissement du riz fait partie du déroulé (30 min), avec le conseil de cuire le riz la veille.
- [x] Modifier, dupliquer, supprimer (avec confirmation et annulation) fonctionnent ; fermer l’éditeur modifié demande confirmation.
- [x] Une photo ajoutée est réduite (1600 px au plus), s’affiche sur la fiche, survit au rechargement et figure dans l’export.
- [x] Export puis import dans un navigateur vierge redonnent les mêmes recettes (égalité profonde) et les mêmes photos ; un fichier cassé, d’une version inconnue ou incomplet est refusé avec un message, sans rien changer.
- [x] `#recettes/<id>` ouvre la fiche ; un identifiant inconnu affiche la bibliothèque et un message.
- [x] Bibliothèque, fiche et éditeur : 5 tailles × 2 thèmes sans débordement ni violation axe ; éditeur utilisable entièrement au clavier, focus rendu au bouton d’ouverture à la fermeture ; pilules propres sur deux lignes.
- [x] JavaScript de démarrage : 60 ko compressés au plus (Dexie compris, éditeur chargé à la demande).
- [x] Tests unitaires : analyseur d’ingrédients (tous les formats ci-dessus), structuration (hachis, dahl, brandade), validation d’import (cas valides et invalides), installation des recettes de départ (idempotente).

## Hors périmètre

- Ajout à la fournée et mise à l’échelle des portions : lot 2.
- Développement des sous-recettes et ordonnancement de la session : lot 3.
- Import depuis une page web (schema.org), partage d’une recette : lot 5.
- Reconnaissance de texte sur la photo, dictée : plus tard.

## Notes techniques

```
src/donnees/base.ts             Dexie, schéma v1, persistance demandée
src/donnees/recettes.ts         Lecture, écriture, duplication, suppression avec annulation
src/donnees/echange.ts          Export et import JSON (version, validation, photos)
src/donnees/depart.ts           Installation idempotente des recettes de départ
src/donnees/recettes-de-depart.ts  Les 13 recettes (données de l’annexe)
src/domaine/ingredients.ts      Analyse d’une ligne d’ingrédient
src/domaine/structuration.ts    Texte libre vers étapes proposées
src/domaine/dictionnaire.ts     Clés, rayons, synonymes
src/domaine/modele.ts           Types Recette, Ingredient, Etape, Origine (+ validation)
src/ecrans/recettes/            Bibliothèque, Fiche, Editeur (chargé à la demande), Photo
```

Ajouts au modèle du plan (section 5) : `Origine.type` gagne `depart` (recette livrée avec l’application, sans badge) ; `Ingredient.facultatif`, `Ingredient.recetteId` (sous-recette) ; `Etape.facultative`, `Etape.anticiper` (`{ delai: 'veille' }`), `Etape.devinee` (durée devinée non confirmée). Les durées « total » affichées s’arrêtent au plat prêt, refroidissement non compris.

## Décisions (25 novembre 2026)

1. **Quantités et étapes** vérifiées sur des recettes de référence (sources dans l’annexe) ; durées « actif » et « total » calculées par le code, pas recopiées à la main.
2. **4 portions par défaut** pour toutes les recettes de départ. Le nombre de portions sera **demandé au moment de choisir le plat** pour la session (lot 2), 4 proposé.
3. **Tian de légumes corse** : feuilles de lasagne, légumes et gruyère.
4. **Omelette normande** : version salée (pommes de terre, lardons, oignon, camembert, crème).
5. **Quiche** : quiche lorraine.
