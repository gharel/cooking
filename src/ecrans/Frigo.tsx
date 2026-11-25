import { useEffect, useRef, useState } from 'preact/hooks';
import { Icone } from '../app/icones';
import type { OngletFrigo } from '../app/routage';
import { CarteAVenir, EnteteEcran } from './AVenir';

const ONGLETS = [
  { id: 'plats', nom: 'Plats préparés', icone: 'frigo' },
  { id: 'reste', nom: 'Ce qu’il reste', icone: 'bol' },
] as const;

export function Frigo({ onglet }: { onglet: OngletFrigo | undefined }) {
  const [actif, setActif] = useState<OngletFrigo>(onglet ?? 'plats');
  const boutons = useRef<Partial<Record<OngletFrigo, HTMLButtonElement | null>>>({});

  // Un lien #reste suivi alors que Frigo est déjà affiché change d’onglet.
  useEffect(() => {
    if (onglet) setActif(onglet);
  }, [onglet]);

  const choisir = (id: OngletFrigo, focus = false) => {
    setActif(id);
    if (focus) boutons.current[id]?.focus();
  };
  const surTouche = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    choisir(actif === 'plats' ? 'reste' : 'plats', true);
  };

  return (
    <EnteteEcran
      id="frigo"
      surtitre="Frigo"
      titre="Frigo et congélateur"
      sousTitre="Bientôt : les plats préparés et des idées pour finir ce qu’il reste."
    >
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
            onKeyDown={surTouche}
          >
            <Icone nom={o.icone} />
            {o.nom}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panneau-plats" aria-labelledby="onglet-plats" hidden={actif !== 'plats'}>
        <CarteAVenir
          lot={4}
          icone="frigo"
          ancreMaquette="frigo"
          description="Chaque plat de la session entre au frigo ou au congélateur avec sa date limite ; alertes du jour et rappels de décongélation."
        />
      </div>
      <div role="tabpanel" id="panneau-reste" aria-labelledby="onglet-reste" hidden={actif !== 'reste'}>
        <CarteAVenir
          lot={4}
          icone="bol"
          ancreMaquette="reste"
          description="Les ingrédients restants, ceux à finir vite, des idées classées et une mini-session anti-gaspi sans rien acheter."
        />
      </div>
    </EnteteEcran>
  );
}
