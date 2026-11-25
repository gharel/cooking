import { CarteAVenir, EnteteEcran } from './AVenir';

export function Session() {
  return (
    <EnteteEcran
      id="session"
      surtitre="Session"
      titre="Session"
      sousTitre="Bientôt : le déroulé calculé de vos recettes, avec minuteurs et mode cuisine."
    >
      <CarteAVenir
        lot={3}
        icone="flamme"
        ancreMaquette="session"
        description="Les étapes de toutes les recettes fusionnées par poste (plan de travail, feux, four, refroidissement), la carte « Maintenant », les minuteurs et l’écran maintenu allumé."
      />
    </EnteteEcran>
  );
}
