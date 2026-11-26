import { useEffect, useRef, useState } from 'preact/hooks';
import { Icone } from '../app/icones';
import type { OngletFrigo } from '../app/routage';
import { plats, rafraichirStock, restes } from '../app/stock-etat';
import { CeQuilReste } from './frigo/CeQuilReste';
import { PlatsPrepares } from './frigo/PlatsPrepares';

const ONGLETS = [
  { id: 'plats', nom: 'Plats préparés', icone: 'frigo' },
  { id: 'reste', nom: 'Ce qu’il reste', icone: 'bol' },
] as const;

export function Frigo({ onglet }: { onglet: OngletFrigo | undefined }) {
  const [actif, setActif] = useState<OngletFrigo>(onglet ?? 'plats');
  const boutons = useRef<Partial<Record<OngletFrigo, HTMLButtonElement | null>>>({});
  useEffect(() => {
    if (onglet) setActif(onglet);
  }, [onglet]);
  useEffect(() => {
    void rafraichirStock();
  }, []);
  const choisir = (id: OngletFrigo, focus = false) => {
    setActif(id);
    if (focus) boutons.current[id]?.focus();
  };
  return (
    <section class="vue" aria-labelledby="titre-frigo">
      <div class="entete">
        <div>
          <p class="surtitre">Frigo</p>
          <h1 id="titre-frigo" tabIndex={-1}>
            Frigo et congélateur
          </h1>
          <p class="sous-titre">
            {plats.value.length} plat{plats.value.length > 1 ? 's' : ''} préparé
            {plats.value.length > 1 ? 's' : ''} · {restes.value.length} ingrédient
            {restes.value.length > 1 ? 's' : ''} qui reste{restes.value.length > 1 ? 'nt' : ''}
          </p>
        </div>
      </div>
      <div class="onglets-vue" role="tablist" aria-label="Contenu du frigo">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            ref={(el) => {
              boutons.current[o.id] = el;
            }}
            type="button"
            role="tab"
            id={`onglet-${o.id}`}
            aria-selected={actif === o.id ? 'true' : 'false'}
            aria-controls={`panneau-${o.id}`}
            tabIndex={actif === o.id ? 0 : -1}
            onClick={() => choisir(o.id)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              e.preventDefault();
              choisir(actif === 'plats' ? 'reste' : 'plats', true);
            }}
          >
            <Icone nom={o.icone} />
            {o.nom}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panneau-plats" aria-labelledby="onglet-plats" hidden={actif !== 'plats'}>
        {actif === 'plats' && <PlatsPrepares />}
      </div>
      <div role="tabpanel" id="panneau-reste" aria-labelledby="onglet-reste" hidden={actif !== 'reste'}>
        {actif === 'reste' && <CeQuilReste />}
      </div>
    </section>
  );
}
