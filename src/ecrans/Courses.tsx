import { CarteAVenir, EnteteEcran } from './AVenir';

export function Courses() {
  return (
    <EnteteEcran
      id="courses"
      surtitre="Courses"
      titre="Courses"
      sousTitre="Bientôt : la liste regroupée par rayon, utilisable hors ligne."
    >
      <CarteAVenir
        lot={2}
        icone="courses"
        ancreMaquette="courses"
        description="Les quantités de toutes les recettes réunies sur une ligne par ingrédient, ce qui est déjà au placard, et le partage de la liste."
      />
    </EnteteEcran>
  );
}
