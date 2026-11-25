import { useEffect, useState } from 'preact/hooks';
import type { FunctionComponent } from 'preact';
import { chargee, recettes } from '../app/bibliotheque-etat';
import { Bibliotheque } from './recettes/Bibliotheque';
import { editeur } from './recettes/etat-editeur';
import { Fiche } from './recettes/Fiche';

/** L’éditeur n’est chargé qu’à la première ouverture : il ne pèse pas sur le démarrage. */
function EditeurALaDemande() {
  const [Editeur, setEditeur] = useState<FunctionComponent<{ recetteId: string | null }> | null>(null);
  const ouvert = editeur.value;
  useEffect(() => {
    if (ouvert && !Editeur) void import('./recettes/Editeur').then((m) => setEditeur(() => m.Editeur));
  }, [ouvert, Editeur]);
  return ouvert && Editeur ? (
    <Editeur key={ouvert.recetteId ?? 'nouvelle'} recetteId={ouvert.recetteId} />
  ) : null;
}

export function Recettes({ recette }: { recette: string | undefined }) {
  const trouvee = recette ? recettes.value.find((r) => r.id === recette) : undefined;
  return (
    <>
      {trouvee ? (
        <Fiche recette={trouvee} />
      ) : (
        <Bibliotheque
          message={
            recette && chargee.value
              ? 'Cette recette n’existe pas ou plus : voici la bibliothèque.'
              : undefined
          }
        />
      )}
      <EditeurALaDemande />
    </>
  );
}
