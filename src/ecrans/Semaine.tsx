import { CarteAVenir, EnteteEcran } from './AVenir';

export function Semaine() {
  return (
    <EnteteEcran
      id="semaine"
      surtitre="Semaine"
      titre="Ma semaine"
      sousTitre="Bientôt : choisir les recettes de la fournée et répartir les repas."
    >
      <CarteAVenir
        lot={2}
        icone="calendrier"
        ancreMaquette="semaine"
        description="Recettes de la fournée, portions, planning des repas et alertes de conservation (un repas prévu trop tard est proposé au congélateur)."
      />
    </EnteteEcran>
  );
}
