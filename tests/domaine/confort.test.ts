import { describe, expect, it } from 'vitest';
import { ajouterPlat, changerRepas, nouvelleFournee, type Fournee } from '../../src/domaine/fournee';
import { statistiques, texteDeLaFournee } from '../../src/domaine/partage';
import { lireRecetteWeb, nettoyer } from '../../src/domaine/schema-org';
import { recettesDeDepart } from '../../src/donnees/recettes-de-depart';

const PAGE = `<!doctype html><html><head><title>Tarte</title>
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":"Page"},
{"@type":"Recipe","name":"Tarte aux poireaux &amp; lardons","recipeYield":["6","6 parts"],
"recipeIngredient":["3 poireaux","200 g de lardons","1 p&acirc;te bris&eacute;e","3 &oelig;ufs"],
"recipeInstructions":[{"@type":"HowToSection","name":"Préparation","itemListElement":[
{"@type":"HowToStep","text":"Émincer les poireaux et les faire fondre 15 min."},
{"@type":"HowToStep","text":"Cuire au four 30 min à 180 °C."}]}],
"url":"https://exemple.fr/tarte"}]}
</script></head><body>…</body></html>`;

describe('import depuis une page web', () => {
  it('lit un JSON-LD Recipe dans un @graph, sections et étapes comprises', () => {
    const r = lireRecetteWeb(PAGE);
    expect(r).toEqual({
      nom: 'Tarte aux poireaux & lardons',
      portions: 6,
      ingredients: ['3 poireaux', '200 g de lardons', '1 pâte brisée', '3 œufs'],
      instructions: 'Émincer les poireaux et les faire fondre 15 min.\nCuire au four 30 min à 180 °C.',
      source: 'https://exemple.fr/tarte',
    });
  });

  it('accepte le bloc JSON seul, instructions en simple texte', () => {
    const r = lireRecetteWeb(
      '{"@type":["Recipe"],"name":"Soupe","recipeYield":"4 personnes","recipeIngredient":["1 potimarron"],"recipeInstructions":"Cuire 25 min puis mixer."}',
      'https://exemple.fr/soupe',
    );
    expect(r).toMatchObject({
      nom: 'Soupe',
      portions: 4,
      instructions: 'Cuire 25 min puis mixer.',
      source: 'https://exemple.fr/soupe',
    });
  });

  it('découpe un texte sans balisage en titre, ingrédients et instructions', () => {
    const r = lireRecetteWeb(
      'Crêpes de mamie\nIngrédients :\n- 250 g de farine\n- 4 œufs\n50 cl de lait\nPréparation :\n1. Mélanger la farine et les œufs.\n2. Ajouter le lait petit à petit.',
    );
    expect(r).toEqual({
      nom: 'Crêpes de mamie',
      portions: null,
      ingredients: ['250 g de farine', '4 œufs', '50 cl de lait'],
      instructions: 'Mélanger la farine et les œufs.\nAjouter le lait petit à petit.',
      source: null,
    });
  });

  it('nettoie balises et entités', () => {
    expect(nettoyer('<b>Crème</b> &amp; fraises&#39;s &#x2019;')).toBe("Crème & fraises's ’");
  });
});

describe('statistiques et partage', () => {
  const terminee = (id: string, reelle: number, sequentielle: number): Fournee => ({
    ...nouvelleFournee(id, '2026-11-25', 'x'),
    statut: 'terminee',
    bilan: {
      termineeLe: 'x',
      dureePrevue: reelle,
      dureeReelle: reelle,
      dureeSequentielle: sequentielle,
      plats: 3,
      portions: 12,
    },
  });

  it('cumule le temps gagné, les plats et les portions', () => {
    expect(
      statistiques([
        terminee('a', 120, 200),
        terminee('b', 100, 90),
        nouvelleFournee('c', '2026-11-25', 'x'),
      ]),
    ).toEqual({
      sessions: 2,
      tempsGagne: 80,
      plats: 6,
      portions: 24,
      dureeMoyenne: 110,
    });
  });

  it('met la fournée en texte : plats, portions, repas', () => {
    let f = ajouterPlat(nouvelleFournee('f', '2026-11-25', 'x'), 'depart-chili', 6);
    f = changerRepas(f, 1, { recetteId: 'depart-chili', platId: null });
    const texte = texteDeLaFournee(f, recettesDeDepart(), [], '14 h');
    expect(texte).toBe(
      'Fournée du dimanche 29 novembre à 14 h\n\nPlats :\n- Chili con carne (6 portions)\n\nRepas :\n- lundi soir : Chili con carne',
    );
  });
});
