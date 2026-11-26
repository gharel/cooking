import { fournee } from '../app/fournee-etat';
import { derniereSession } from '../app/historique-etat';
import { Icone } from '../app/icones';
import type { Fournee } from '../domaine/fournee';
import { formaterDuree } from '../domaine/texte';
import { EnCours } from './session/EnCours';
import { Preparation } from './session/Preparation';

function Bilan({ f }: { f: Fournee }) {
  const b = f.bilan;
  if (!b) return null;
  const gain = b.dureeSequentielle - b.dureeReelle;
  return (
    <section class="carte bilan" aria-labelledby="titre-bilan">
      <p class="etiquette">
        <Icone nom="valider" />
        Dernière session
      </p>
      <h2 id="titre-bilan">
        Terminée en {formaterDuree(b.dureeReelle)} (prévue {formaterDuree(b.dureePrevue)})
      </h2>
      <p class="aide">
        {b.plats} plats, {b.portions} portions.{' '}
        {gain > 0 ? `${formaterDuree(gain)} gagnées par rapport aux recettes enchaînées une à une.` : ''}
      </p>
      <a class="bouton bouton-secondaire" href="#frigo">
        <Icone nom="frigo" />
        Voir le frigo
      </a>
    </section>
  );
}

export function Session() {
  const f = fournee.value;
  const derniere = derniereSession.value;
  return (
    <section class="vue vue-session" aria-labelledby="titre-session">
      {!f ? (
        <h1 id="titre-session" tabIndex={-1}>
          Session
        </h1>
      ) : f.statut === 'session' ? (
        <EnCours f={f} />
      ) : f.plats.length > 0 ? (
        <>
          <Preparation f={f} />
          {derniere && <Bilan f={derniere} />}
        </>
      ) : (
        <>
          <div class="entete">
            <div>
              <p class="surtitre">Session</p>
              <h1 id="titre-session" tabIndex={-1}>
                Session
              </h1>
              <p class="sous-titre">Choisissez d’abord les plats de la fournée.</p>
            </div>
          </div>
          {derniere && <Bilan f={derniere} />}
          <div class="carte a-venir">
            <span class="rond">
              <Icone nom="calendrier" />
            </span>
            <div class="a-venir-texte">
              <h2>Aucun plat dans la fournée</h2>
              <p>Le déroulé se calcule à partir des plats choisis pour la semaine.</p>
              <a class="bouton bouton-primaire" href="#semaine">
                <Icone nom="calendrier" />
                Choisir les plats
              </a>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
