# Plan produit et technique : Fournée

> Statut : **version 1 livrée** les 25 et 26 novembre 2026 (lots 0 à 5, specs `docs/specs/001` à `006`). Validé le 25 novembre avec deux ajouts demandés : les recettes de famille ou maison, et le mode « Ce qu’il reste ». « Fournée » est un nom de travail (une fournée, c’est un batch). Application : https://gharel.github.io/cooking/ ; maquette : https://gharel.github.io/cooking/maquette/.
>
> Décisions : charte propre (projet personnel, pas la charte Skazy) ; Preact + TypeScript ; dépôt public `gharel/cooking` publié sur GitHub Pages.

## 1. Le problème

Le batch cooking fait gagner du temps la semaine, mais la session du dimanche reste difficile à mener : quatre recettes lues l’une après l’autre, des feux et un four à partager, des minuteurs partout, puis des boîtes dont on oublie la date. Les applications existantes (voir `docs/BENCHMARK.md`) choisissent les menus à votre place ou rangent vos recettes, mais aucune ne **calcule le déroulé d’une session à partir de vos propres recettes**.

## 2. La proposition

**Vos recettes, une session orchestrée, un frigo sous contrôle.**

1. **Semaine** : choisir les recettes de la fournée et le nombre de portions ; répartir les repas sur la semaine. L’application signale un repas prévu au-delà de la durée de conservation au frigo et propose de congeler ces portions.
2. **Courses** : liste consolidée par rayon (les 4 oignons du chili et du curry sur une seule ligne), déduction de ce qui est déjà au placard, partage.
3. **Session** : l’ordonnanceur fusionne les étapes de toutes les recettes en un déroulé unique par poste (plan de travail, feux, four, refroidissement). Une carte « Maintenant », les minuteurs de chaque cuisson, la suite, et une frise. Mode cuisine : gros caractères, écran maintenu allumé.
4. **Frigo, onglet « Plats préparés »** : en fin de session, chaque plat entre au frigo ou au congélateur avec sa date limite. Alertes « à manger aujourd’hui », rappels de décongélation la veille.
5. **Frigo, onglet « Ce qu’il reste »** (anti-gaspi) : la liste des ingrédients restants, alimentée à la main, par la différence entre courses et session (« il devrait rester une demi-botte de menthe ») et par les plats préparés du stock. On marque ce qui est « à finir vite ». L’application propose des idées classées (ce qu’elles utilisent, ce qu’elles sauvent, ce qui manque) et une **mini-session anti-gaspi** : deux recettes sans achat qui finissent le plus d’ingrédients urgents.
6. **Recettes** : bibliothèque personnelle avec des étapes **structurées** (poste, durée, actif ou passif, dépendances), indispensables à l’ordonnanceur. Import par JSON, texte collé ou page web (schema.org `Recipe`).
7. **Recettes de famille et maison** : « le hachis de maman », « notre dahl du dimanche ». On écrit la recette comme on la raconte ; Fournée **garde ce texte tel quel** et propose des étapes structurées à vérifier (durées devinées signalées). Origine (famille, maison, web, livre), « de qui », son petit mot, photo de la fiche manuscrite. Filtre « Famille et maison » dans la bibliothèque.

### Principes

- **Local d’abord** : pas de compte, pas d’abonnement, données dans le navigateur (IndexedDB), export et import JSON. Fonctionne hors ligne (PWA installable).
- **Responsive** : téléphone dans la cuisine en priorité, tablette posée sur le plan de travail, ordinateur pour préparer la semaine.
- **Thème clair, sombre ou système**, verrouillé contre le mode nuit de Brave et Dark Reader.
- **Accessible** (WCAG 2.2 AA) et en français soigné.
- **Prudent sur la sécurité alimentaire** : durées de conservation par défaut modifiables, sourcées, jamais présentées comme un avis sanitaire.

### Hors périmètre du MVP

Comptes et synchronisation entre appareils, commande en drive, calcul nutritionnel détaillé, génération de recettes par IA, partage social.

## 3. Utilisateurs cibles

| Profil                       | Besoin principal                                            |
| ---------------------------- | ----------------------------------------------------------- |
| Foyer actif (2 à 4 pers.)    | Ne plus réfléchir aux repas de la semaine, gagner du temps  |
| Étudiant, personne seule     | Petit budget, éviter le gaspillage, congeler intelligemment |
| Cuisinier qui a ses recettes | Les orchestrer sans abonnement ni catalogue imposé          |

## 4. Parcours clés

1. **Préparer la semaine** (ordinateur ou téléphone, 5 min) : Semaine, ajouter 4 recettes, ajuster les portions, répartir les repas, valider. La liste de courses est prête.
2. **Faire les courses** (téléphone, en magasin) : cocher par rayon, masquer les articles cochés, hors ligne.
3. **Cuisiner** (téléphone ou tablette, 2 h) : lancer la session, suivre « Maintenant », valider chaque étape ; les minuteurs sonnent ; un retard recalcule la suite.
4. **Ranger** (fin de session) : portionner, étiqueter (dates proposées), les plats entrent au stock.
5. **Manger** (la semaine) : alerte du jour, rappel de décongélation la veille, « Manger 1 portion ».
6. **Finir le frigo** (fin de semaine, téléphone, 1 min) : Frigo, « Ce qu’il reste », retirer ou ajouter quelques ingrédients, choisir une idée ou la mini-session.
7. **Sauver la recette de maman** (5 min) : Nouvelle recette, « De la famille », « Maman », taper ou dicter le texte, photo de la fiche, « Proposer les étapes », corriger les durées en pointillés, enregistrer.

## 5. Modèle de données (première version)

```ts
type Poste = 'plan' | 'feu' | 'four' | 'robot' | 'repos';

interface Recette {
  id: string;
  nom: string;
  portions: number;
  ingredients: Ingredient[];
  etapes: Etape[];
  conservation: { frigoJours: number; congelateurJours: number | null };
  etiquettes: string[]; // vegetarien, congelable…
  origine: {
    type: 'famille' | 'maison' | 'web' | 'livre';
    de?: string; // « Maman », « Nous », nom du site ou du livre
    mot?: string; // son petit mot
    source?: string; // adresse web ou référence du livre
  };
  texteOriginal?: string; // tel que saisi, jamais réécrit
  photos: string[]; // identifiants de photos (fiche manuscrite) stockées en IndexedDB
  couleur: string; // jeton de la palette des recettes
}

interface IngredientRestant {
  id: string;
  nom: string; // tel que saisi : « ½ courgette »
  cle: string; // « courgette » : sert à la correspondance avec les recettes
  quantite: number | null;
  unite: string | null;
  aFinirVite: boolean;
  ajoutele: string; // date ISO
  provenance: 'manuel' | 'courses' | 'plat';
}

interface Ingredient {
  nom: string;
  quantite: number | null;
  unite: string | null;
  rayon: Rayon;
  cle?: string; // « oignon-jaune » : sert au regroupement dans les courses et la session
}

interface Etape {
  id: string;
  texte: string;
  dureeMin: number;
  active: boolean; // occupe le cuisinier (sinon elle n’occupe que son poste)
  poste: Poste;
  apres: string[]; // identifiants des étapes préalables
  action?: { verbe: string; ingredient?: string; decoupe?: string }; // permet de regrouper « émincer oignon »
}

interface Fournee {
  id: string;
  semaine: string; // 2026-W49
  recettes: { recetteId: string; portions: number }[];
  repas: {
    jour: string;
    moment: 'midi' | 'soir';
    recetteId: string | null;
    depuis: 'frigo' | 'congelateur';
  }[];
  session?: SessionEnCours;
}

interface PlatStocke {
  id: string;
  recetteId: string;
  portions: number;
  lieu: 'frigo' | 'congelateur';
  preparele: string; // date ISO
  limite: string; // date ISO calculée, modifiable
}

interface Equipement {
  feux: number;
  fours: number;
  robot: boolean;
  cuisiniers: 1 | 2;
}
```

Chaque export JSON porte un numéro de version de schéma ; les migrations sont testées. Un fichier illisible n’écrase jamais les données en place.

## 6. L’ordonnanceur de session (le cœur)

**Entrée** : les étapes de toutes les recettes (graphe de dépendances sans cycle), l’équipement (feux, fours, robot, nombre de cuisiniers).

1. **Mise à l’échelle** des quantités selon les portions.
2. **Regroupement** des préparations identiques : même verbe, même ingrédient, même découpe (« émincer 2 oignons » du chili + « émincer 2 oignons » du curry deviennent « émincer 4 oignons »). Durée recalculée, dépendances fusionnées.
3. **Ordonnancement par liste** avec ressources : à chaque instant, parmi les étapes prêtes, on lance d’abord celle dont le **chemin restant est le plus long** (chemin critique). Une étape active réserve le cuisinier et son poste, une étape passive seulement son poste. Les étapes passives longues (mijoter, four, refroidir) démarrent au plus tôt pour masquer leur durée.
4. **Temps masqués** : vaisselle et rangement insérés dans les creux du cuisinier.
5. **Sortie** : frise par poste, durée totale, gain par rapport à l’enchaînement recette par recette.
6. **En direct** : une étape terminée en avance ou en retard décale la suite ; on recalcule à partir de l’état réel.

**Qualité** : fonction pure et déterministe. Tests par propriétés (fast-check) : dépendances respectées, aucun poste ni cuisinier en double emploi, durée au moins égale au chemin critique, résultat identique à entrée identique. Jeux d’essai de référence (4 recettes, 1 et 2 cuisiniers, 2 et 4 feux).

## 7. Structurer une recette racontée

Une recette de famille arrive en texte libre (« Cuire les pommes de terre 25 min. Pendant ce temps, faire revenir les oignons… »). Un analyseur **local, à base de règles** (pas d’IA ni de réseau au MVP) propose :

- **Étapes** : découpage par phrases et par « puis », « ensuite » ; une étape par verbe d’action.
- **Durées** : « 25 min », « 1 h 30 », « une demi-heure » ; sinon une durée **devinée** d’après le verbe (émincer 5 min, revenir 10 min), signalée en pointillés.
- **Postes** : cuire, mijoter, revenir donnent le feu ; enfourner, gratiner, cuire au four donnent le four ; couper, écraser, monter donnent le plan de travail ; reposer, refroidir donnent le repos. Actif ou passif selon le verbe.
- **Dépendances** : ordre du texte par défaut ; « pendant ce temps » rend deux étapes parallèles.
- **Ingrédients** : quantité, unité, nom (« 500 g de bœuf haché »), rayon deviné.

Rien n’est enregistré sans relecture ; le texte original reste attaché à la recette et s’affiche tel quel. Plus tard, en option : reconnaissance de texte sur la photo de la fiche (Tesseract.js, sur l’appareil) et dictée.

## 8. Idées avec ce qu’il reste

- **Correspondance** par clé d’ingrédient (« ½ courgette » donne `courgette`), avec un dictionnaire de synonymes. Les basiques du placard (huile, sel, épices) sont supposés présents, réglables.
- **Score** d’une idée : ingrédients utilisés + 2 × ingrédients « à finir vite » sauvés - 1,5 × ingrédients manquants. Au MVP on regarde la présence ; en V1, les quantités (3 œufs ne suffisent pas pour deux plats aux œufs).
- **Mini-session anti-gaspi** : parmi les idées sans achat, la paire qui finit le plus d’ingrédients urgents, puis le plus d’ingrédients ; elle passe par l’ordonnanceur comme une petite fournée.
- **Sources d’idées** : la bibliothèque personnelle d’abord (recettes de famille comprises), puis un petit catalogue d’idées anti-gaspi fourni avec l’application.

## 9. Architecture technique (validée, voir `docs/adr/0001-pile-technique.md`)

| Sujet        | Choix proposé                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| Construction | Vite + TypeScript strict                                                                                   |
| Interface    | Preact (3 ko) + signaux ; CSS natif à jetons (pas de framework CSS)                                        |
| Données      | IndexedDB via Dexie, export et import JSON versionnés                                                      |
| Hors ligne   | PWA (vite-plugin-pwa, Workbox), installable, polices auto-hébergées                                        |
| Cuisine      | Screen Wake Lock API, Notifications et Web Audio pour les minuteurs                                        |
| Tests        | Vitest (+ fast-check) ; Playwright + axe-core, 5 tailles d’écran × 2 thèmes                                |
| Qualité      | ESLint, Prettier, html-validate, hooks git (simple-git-hooks)                                              |
| Publication  | GitHub Actions : tests puis GitHub Pages (https://gharel.github.io/cooking/) ; d’ici le lot 0, la maquette |

Organisation prévue :

```
src/
  domaine/        Logique pure, sans DOM : ordonnanceur, regroupement, courses, conservation, mise à l’échelle, structuration, idées
  donnees/        Dexie, schéma, migrations, export et import
  interface/      Composants Preact par écran (semaine, courses, session, frigo, recettes)
  styles/         Jetons (clair et sombre) et composants CSS
  pwa/            Service worker, manifeste
tests/
  domaine/        Tests unitaires et par propriétés
  e2e/            Parcours Playwright + axe
docs/
  PLAN.md, BENCHMARK.md, adr/, specs/
```

## 10. Lots et critères d’acceptation

Chaque lot commence par une spec courte dans `docs/specs/` et se termine par une version publiée.

| Lot                       | Contenu                                                                                                                                                                                                    | Critères d’acceptation (extraits)                                                                                                                                                                                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0. Fondations**         | Dépôt, Vite + TS, lint, tests, CI, Pages, coque responsive, navigation, thème, PWA vide                                                                                                                    | `npm run check` et la CI passent ; la page s’installe et s’ouvre hors ligne ; aucun défilement horizontal de 360 à 1920 px ; axe sans violation en clair et en sombre                                                                                                                              |
| **1. Recettes**           | Bibliothèque, saisie des étapes structurées, recettes de famille et maison (texte libre, structuration proposée, origine, petit mot, photo de la fiche), import JSON et texte, recettes d’exemple          | Une recette saisie survit au rechargement ; le texte original est restitué à l’identique ; l’exemple du hachis donne 5 étapes dont 1 parallèle et 3 durées devinées signalées ; un import invalide est refusé sans rien écraser ; export puis import redonnent les mêmes données                   |
| **2. Semaine et courses** | Choix des recettes, portions, planning des repas, liste consolidée par rayon, placard, partage                                                                                                             | choisir un plat pour la session demande le nombre de portions (4 proposé) et met les quantités à l’échelle ; 2 oignons + 2 oignons donnent une ligne « 4 oignons » avec le détail des recettes ; un repas à J+4 déclenche la suggestion de congélation ; la liste reste utilisable hors ligne      |
| **3. Session**            | Ordonnanceur, frise, carte « Maintenant », minuteurs, mode cuisine, recalcul en direct                                                                                                                     | Les propriétés de l’ordonnanceur passent ; la session de démonstration tient en moins de 60 % du temps séquentiel ; l’écran reste allumé ; un minuteur sonne même onglet en arrière-plan (notification)                                                                                            |
| **4. Frigo**              | Plats préparés (entrée en fin de session, dates limites, alertes, décongélation, consommation) ; « Ce qu’il reste » (ingrédients, à finir vite, idées, mini-session anti-gaspi)                            | Les dates proposées suivent les durées de la recette ; l’alerte du jour apparaît à l’ouverture ; « Manger 1 portion » à 0 retire le plat ; retirer un ingrédient met les idées à jour ; une idée sans achat est signalée « Rien à acheter » ; cuisiner une idée retire du frigo ce qu’elle utilise |
| **5. Confort**            | Statistiques (temps gagné), import depuis une page web, partage d’une recette de famille (fichier ou fiche imprimable), partage d’une fournée, quantités dans les idées, reconnaissance de texte sur photo | Import d’une page schema.org `Recipe` collée ; une recette de famille exportée puis importée sur un autre appareil garde texte, mot et photo                                                                                                                                                       |

| **6. Ce soir et session à plusieurs** (spec 007) | Widget « Ce soir », plan B (adresses, roulette), rappel du dîner et agenda, recettes du soir, prénoms et répartition des tâches, hygiène, vaisselle et nettoyage dans le déroulé | Voir la spec 007 : roulette uniforme, adresses gardées, `.ics` correct, légumes avant la viande crue, lavage des mains au début et rangement à la fin, personne avec deux tâches à la fois |

L’import direct par URL se heurte au CORS dans un navigateur : au MVP, on colle le contenu ou on partage la page vers l’application (Web Share Target). Un petit relais serveur reste une option pour plus tard.

## 11. Qualité et vérifications

- Tailles d’écran vérifiées : 360, 390, 820, 1280 et 1920 px, en clair et en sombre ; pas de défilement horizontal, aucun texte coupé, cibles d’au moins 44 px.
- Brave sur iPhone (mode nuit = Dark Reader) : `<meta name="darkreader-lock">` après `<meta name="color-scheme" content="light dark">`.
- `prefers-reduced-motion` respecté ; contrastes AA vérifiés pour chaque jeton, dans les deux thèmes.
- Budget : moins de 100 ko de JavaScript compressé au premier chargement.
- Aucune télémétrie, aucune ressource distante à l’exécution.

## 12. Décisions et points ouverts

| Sujet        | Décision                                                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identité     | Charte propre (Fraunces pour les titres, Figtree pour le texte, terracotta), pas la charte Skazy                                                          |
| Pile         | Preact + TypeScript (ADR 0001 accepté)                                                                                                                    |
| Dépôt        | Public, `gharel/cooking`, publié sur https://gharel.github.io/cooking/                                                                                    |
| Dépôt public | Aucune vraie recette de famille, photo ou donnée personnelle dans le dépôt : exemples fictifs seulement ; les recettes de chacun restent sur son appareil |

Décisions prises en livrant (détail dans les specs) :

- **Portions** : 4 par défaut, demandées au moment de choisir un plat ; 1 repas = 1 portion par personne du foyer (2 par défaut).
- **Temps de préparation** : ×2 portions donne ×1,5 de préparation ; les cuissons ne changent pas.
- **Fours** : 2 plats par four à la même température ; un préchauffage devient inutile si le four est déjà chaud.
- **Décongélation** : 24 h au frigo ; rappel la veille au soir.
- **Écrans chargés à la demande** pour tenir le budget de 60 ko au démarrage (56 ko avec Dexie).
- **Reconnaissance de texte sur photo** reportée (ADR 0002) ; import web par copier-coller (CORS).
- **Notification du dîner** sans serveur : minuterie dans la page et agenda `.ics` (ADR 0003).
- **Session à plusieurs** : une tâche active va à la personne libre qui a le moins travaillé ; le lavage de la planche après la viande crue fait partie de la découpe (spec 007).
- **Référencement** : la page reste en `noindex`, comme les autres outils de gharel.github.io : une application personnelle, locale, n’a rien à gagner à être indexée.

Points ouverts : nom définitif (« Fournée » en attendant), licence du code (aucune pour l’instant, donc tous droits réservés).
