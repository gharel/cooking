import { useEffect } from 'preact/hooks';
import { aujourdhui, dateLongue } from '../domaine/dates';
import { rappelSauvegarde } from '../domaine/sauvegarde';
import { chargee, recettes } from './bibliotheque-etat';
import { Icone } from './icones';
import { chargerSauvegarde, etatSauvegarde, reporterRappel, telechargerExport } from './sauvegarde-etat';

/** Après le clic, le bandeau disparaît : le focus revient au titre de l’écran. */
const focusTitre = () => document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });

/** Rappel d’exporter les recettes qui n’existent que sur cet appareil (spec 009). */
export function RappelSauvegarde() {
  useEffect(() => {
    void chargerSauvegarde();
  }, []);
  const etat = etatSauvegarde.value;
  if (!etat || !chargee.value) return null;
  const rappel = rappelSauvegarde(recettes.value, etat, new Date());
  if (!rappel) return null;
  const { nombre, derniere } = rappel;
  return (
    <div class="bandeau bandeau-info bandeau-fermable rappel-sauvegarde">
      <p>
        <strong>
          {nombre} recette{nombre > 1 ? 's ne sont pas sauvegardées' : ' n’est pas sauvegardée'}.
        </strong>{' '}
        {derniere
          ? `Dernière sauvegarde le ${dateLongue(aujourdhui(new Date(derniere)))}.`
          : 'Aucune sauvegarde pour l’instant.'}{' '}
        Gardez un fichier ailleurs (Fichiers, iCloud, clé USB) pour ne pas les perdre si le navigateur efface
        ses données.
      </p>
      <div class="actions-rappel">
        <button
          type="button"
          class="bouton bouton-primaire bouton-petit"
          onClick={() => void telechargerExport().then(focusTitre)}
        >
          <Icone nom="exporter" />
          Exporter maintenant
        </button>
        <button
          type="button"
          class="bouton bouton-secondaire bouton-petit"
          onClick={() => void reporterRappel().then(focusTitre)}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
