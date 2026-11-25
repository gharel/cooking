import { Icone } from '../../app/icones';
import { dureeActive, dureeTotale } from '../../domaine/durees';
import { estAStructurer, estCongelable, passeAuFour, type Recette } from '../../domaine/modele';
import { formaterDuree } from '../../domaine/texte';

/** Teinte décorative stable d’une recette (1 à 6), tirée de son identifiant. */
export function teinte(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 6) + 1;
}

export function resume(r: Recette): string {
  const morceaux = [`${r.portions} portions`];
  if (!estAStructurer(r)) {
    morceaux.push(`actif ${formaterDuree(dureeActive(r))}`);
    const total = formaterDuree(dureeTotale(r));
    morceaux.push(`total ${total}${r.etapes.some((e) => e.sousRecetteId) ? ' + sous-recette' : ''}`);
  }
  return morceaux.join(' · ');
}

export function Etiquettes({ recette: r }: { recette: Recette }) {
  return (
    <span class="etiquettes">
      {r.origine.type === 'famille' && (
        <span class="pastille pastille-famille">
          <Icone nom="coeur" />
          {r.origine.de ? `De ${r.origine.de}` : 'De la famille'}
        </span>
      )}
      {r.origine.type === 'maison' && (
        <span class="pastille pastille-famille">
          <Icone nom="maison" />
          Notre recette
        </span>
      )}
      {r.soir && <span class="pastille pastille-soir">Du soir</span>}
      {estAStructurer(r) && <span class="pastille pastille-bientot">À structurer</span>}
      {estCongelable(r) && <span class="pastille">Congelable</span>}
      {r.vegetarien && <span class="pastille">Végétarien</span>}
      {passeAuFour(r) && <span class="pastille">Four</span>}
    </span>
  );
}
