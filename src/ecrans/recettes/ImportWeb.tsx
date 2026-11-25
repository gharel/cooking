import { signal } from '@preact/signals';
import { useState } from 'preact/hooks';
import { Dialogue } from '../../app/Dialogue';
import { Icone } from '../../app/icones';
import { analyserIngredient } from '../../domaine/ingredients';
import type { Recette } from '../../domaine/modele';
import { lireRecetteWeb } from '../../domaine/schema-org';
import { nouvelIdentifiant } from '../../donnees/base';
import { ouvrirEditeur } from './etat-editeur';

/** Import ouvert : contenu déjà connu (partage reçu d’une autre application) ou vide. */
export const importWeb = signal<{ texte: string; adresse: string } | null>(null);

function ImportWebOuvert({
  texteInitial,
  adresseInitiale,
}: {
  texteInitial: string;
  adresseInitiale: string;
}) {
  const [texte, setTexte] = useState(texteInitial);
  const [adresse, setAdresse] = useState(adresseInitiale);
  const [erreur, setErreur] = useState('');
  const fermer = () => (importWeb.value = null);
  function lire() {
    const lue = lireRecetteWeb(texte, adresse.trim() || null);
    if (!lue || (lue.ingredients.length === 0 && !lue.instructions)) {
      setErreur('Aucune recette trouvée. Collez tout le code de la page, ou le texte de la recette.');
      return;
    }
    const maintenant = new Date().toISOString();
    const modele: Recette = {
      id: nouvelIdentifiant('recette'),
      nom: lue.nom,
      sousTitre: null,
      note: null,
      portions: lue.portions ?? 4,
      vegetarien: false,
      ingredients: lue.ingredients.map((l) => analyserIngredient(l)),
      etapes: [],
      conservation: { frigoJours: 3, congelateurMois: 3 },
      origine: { type: 'web', de: null, mot: null, source: lue.source },
      texteOriginal: lue.instructions || null,
      photos: [],
      creeLe: maintenant,
      modifieLe: maintenant,
    };
    fermer();
    ouvrirEditeur(null, modele);
  }
  return (
    <Dialogue
      id="titre-import-web"
      surtitre="Importer"
      titre="Depuis une page web"
      onFermer={fermer}
      pied={
        <>
          <button type="button" class="bouton bouton-secondaire" onClick={fermer}>
            Annuler
          </button>
          <button type="button" class="bouton bouton-primaire" onClick={lire}>
            <Icone nom="etincelles" />
            Lire la recette
          </button>
        </>
      }
    >
      {erreur && (
        <p class="bandeau bandeau-alerte" role="alert">
          {erreur}
        </p>
      )}
      <p class="aide">
        Sur la page de la recette, affichez le code source (ou partagez la page vers Fournée), copiez tout et
        collez-le ici. Le texte d’une recette fonctionne aussi. Le navigateur ne peut pas lire la page
        lui-même.
      </p>
      <label class="champ">
        <span>Code de la page ou texte de la recette</span>
        <textarea rows={8} value={texte} onInput={(e) => setTexte(e.currentTarget.value)} />
      </label>
      <label class="champ">
        <span>Adresse de la page (facultatif)</span>
        <input type="url" value={adresse} onInput={(e) => setAdresse(e.currentTarget.value)} />
      </label>
    </Dialogue>
  );
}

export function ImportWeb() {
  const ouvert = importWeb.value;
  return ouvert ? <ImportWebOuvert texteInitial={ouvert.texte} adresseInitiale={ouvert.adresse} /> : null;
}
