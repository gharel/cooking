import { Dialogue } from './Dialogue';
import { Icone } from './icones';
import { plateforme } from './installation';

function Iphone() {
  return (
    <>
      <p>Sur iPhone, l’installation passe par le menu Partager du navigateur :</p>
      <ol class="etapes-installation">
        <li>
          <Icone nom="partage" />
          <span>
            Touchez <strong>Partager</strong> : en bas de l’écran dans Safari, dans la barre d’adresse ou le
            menu dans Brave, Chrome ou Firefox.
          </span>
        </li>
        <li>
          <Icone nom="ajout-carre" />
          <span>
            Choisissez <strong>« Sur l’écran d’accueil »</strong> (faites défiler la liste si besoin).
          </span>
        </li>
        <li>
          <Icone nom="valider" />
          <span>
            Touchez <strong>Ajouter</strong> : Fournée s’ouvre ensuite en plein écran, comme une application.
          </span>
        </li>
      </ol>
      <p class="aide">
        Bon à savoir : sur iPhone, l’application installée garde ses données à part du navigateur. Si vous
        avez déjà des recettes ici, exportez-les (Recettes, Exporter), puis importez-les dans l’application.
      </p>
    </>
  );
}

function Android() {
  return (
    <>
      <p>Votre navigateur propose l’installation depuis son menu :</p>
      <ol class="etapes-installation">
        <li>
          <Icone nom="menu-points" />
          <span>
            Ouvrez le <strong>menu</strong> du navigateur (les trois points, en haut ou en bas de l’écran).
          </span>
        </li>
        <li>
          <Icone nom="ajout-carre" />
          <span>
            Choisissez <strong>« Installer l’application »</strong> ou{' '}
            <strong>« Ajouter à l’écran d’accueil »</strong>.
          </span>
        </li>
        <li>
          <Icone nom="valider" />
          <span>Confirmez : Fournée rejoint vos applications.</span>
        </li>
      </ol>
    </>
  );
}

/** Marche à suivre quand le navigateur ne propose pas lui-même l’installation (toujours le cas sur iPhone). */
export function AideInstallation({ onFermer }: { onFermer: () => void }) {
  return (
    <Dialogue
      id="titre-installation"
      surtitre="Sur l’écran d’accueil"
      titre="Installer Fournée"
      onFermer={onFermer}
      etroit
      pied={
        <button type="button" class="bouton bouton-primaire" onClick={onFermer}>
          J’ai compris
        </button>
      }
    >
      {plateforme === 'ios' ? <Iphone /> : <Android />}
    </Dialogue>
  );
}
