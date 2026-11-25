import { useEffect, useRef } from 'preact/hooks';
import { Courses } from '../ecrans/Courses';
import { Frigo } from '../ecrans/Frigo';
import { Recettes } from '../ecrans/Recettes';
import { Semaine } from '../ecrans/Semaine';
import { Session } from '../ecrans/Session';
import { ChoixPlat } from '../ecrans/semaine/ChoixPlat';
import { Annonces } from './annonces';
import { BoutonTheme } from './BoutonTheme';
import { route } from './etat';
import { Icone, SpriteIcones } from './icones';
import { ECRANS, type Route } from './routage';

function Ecran({ courante }: { courante: Route }) {
  switch (courante.ecran) {
    case 'semaine':
      return <Semaine />;
    case 'courses':
      return <Courses />;
    case 'session':
      return <Session />;
    case 'frigo':
      return <Frigo onglet={courante.onglet} />;
    case 'recettes':
      return <Recettes recette={courante.recette} />;
  }
}

function Marque({ classe }: { classe: string }) {
  return (
    <a class={classe} href="#semaine">
      <span class="logo">
        <Icone nom="bocal" />
      </span>
      <span class="marque-texte">
        <strong>Fournée</strong>
        <small>Batch cooking</small>
      </span>
    </a>
  );
}

export function Coque() {
  const courante = route.value;
  const nom = (ECRANS.find((e) => e.id === courante.ecran) ?? ECRANS[0]).nom;
  const premierAffichage = useRef(true);

  useEffect(() => {
    document.title = `${nom}\u00a0· Fournée`;
  }, [nom]);

  // Après un changement d’écran : haut de page et focus sur le titre (lecteurs d’écran, clavier).
  useEffect(() => {
    if (premierAffichage.current) {
      premierAffichage.current = false;
      return;
    }
    scrollTo(0, 0);
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [courante]);

  return (
    <>
      <SpriteIcones />
      <a
        class="lien-evitement"
        href="#contenu"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('contenu')?.focus();
        }}
      >
        Aller au contenu
      </a>
      <div class="app">
        <nav class="navigation" aria-label="Navigation principale">
          <Marque classe="nav-marque" />
          <ul>
            {ECRANS.map((e) => (
              <li key={e.id}>
                <a href={`#${e.id}`} aria-current={e.id === courante.ecran ? 'page' : undefined}>
                  <Icone nom={e.icone} />
                  <span>{e.nom}</span>
                </a>
              </li>
            ))}
          </ul>
          <div class="nav-pied">
            <Icone nom="cadenas" />
            <p>Vos données restent sur cet appareil, même hors ligne.</p>
          </div>
        </nav>
        <div class="colonne">
          <header class="barre">
            <Marque classe="marque" />
            <span class="pastille pastille-chantier">En construction</span>
            <span class="barre-espace" />
            <BoutonTheme />
          </header>
          <main id="contenu" tabIndex={-1}>
            <Ecran courante={courante} />
          </main>
        </div>
      </div>
      <ChoixPlat />
      <Annonces />
    </>
  );
}
