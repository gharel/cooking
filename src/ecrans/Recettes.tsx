import { CarteAVenir, EnteteEcran } from './AVenir';

export function Recettes() {
  return (
    <EnteteEcran
      id="recettes"
      surtitre="Bibliothèque"
      titre="Recettes"
      sousTitre="Bientôt : votre bibliothèque, recettes de famille comprises."
    >
      <CarteAVenir
        lot={1}
        icone="livre"
        ancreMaquette="recettes"
        description="Des étapes structurées pour orchestrer la session ; les recettes de famille ou maison saisies comme on les raconte, texte d’origine gardé."
      />
    </EnteteEcran>
  );
}
