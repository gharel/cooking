import type { ComponentChildren } from 'preact';
import { Icone, type NomIcone } from '../app/icones';

interface Entete {
  id: string;
  surtitre: string;
  titre: string;
  sousTitre: string;
  children: ComponentChildren;
}

/** En-tête commun : une seule h1 par écran, focalisable après un changement d’écran. */
export function EnteteEcran({ id, surtitre, titre, sousTitre, children }: Entete) {
  return (
    <section class="vue" aria-labelledby={`titre-${id}`}>
      <div class="entete">
        <div>
          <p class="surtitre">{surtitre}</p>
          <h1 id={`titre-${id}`} tabIndex={-1}>
            {titre}
          </h1>
          <p class="sous-titre">{sousTitre}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

interface CarteAVenirProps {
  lot: number;
  icone: NomIcone;
  description: string;
  ancreMaquette: string;
}

/** Écran pas encore construit : ce qui arrive, quand, et où le voir dans la maquette. */
export function CarteAVenir({ lot, icone, description, ancreMaquette }: CarteAVenirProps) {
  return (
    <div class="carte a-venir">
      <span class="rond">
        <Icone nom={icone} />
      </span>
      <div class="a-venir-texte">
        <h2>Arrive au lot {lot}</h2>
        <p>{description}</p>
        <a class="bouton bouton-secondaire" href={`${import.meta.env.BASE_URL}maquette/#${ancreMaquette}`}>
          <Icone nom="maquette" />
          Voir cet écran dans la maquette
        </a>
      </div>
    </div>
  );
}
