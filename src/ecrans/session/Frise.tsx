import type { Placement, Tache } from '../../domaine/ordonnanceur';
import { teinte } from '../recettes/commun';

const ORDRE = ['plan', 'feu', 'four', 'repos'];

export function libelleVoie(voie: string, cuisiniers: number): string {
  const [type, n] = voie.split(' ');
  if (type === 'plan') return cuisiniers > 1 && n ? `Cuisinier ${n}` : 'Plan de travail';
  if (type === 'feu') return `Feu ${n ?? ''}`;
  if (type === 'four') return `Four ${n ?? ''}`;
  return 'Repos';
}

export const classeTache = (t: Tache | undefined): string =>
  t ? (t.recettes.length > 1 ? 'teinte-commun' : `teinte-${teinte(t.recettes[0] ?? '')}`) : '';

interface Props {
  taches: readonly Tache[];
  placements: readonly Placement[];
  duree: number;
  maintenant: number | null;
  heure: (minutes: number) => string;
  cuisiniers: number;
  terminees: ReadonlySet<string>;
}

/** Frise par poste : une ligne par cuisinier, feu, four ; les repos sur autant de lignes que nécessaire. */
export function Frise({ taches, placements, duree, maintenant, heure, cuisiniers, terminees }: Props) {
  const parId = new Map(taches.map((t) => [t.id, t]));
  const visibles = placements.filter((p) => p.fin - p.debut > 1e-6);
  const echelle = Math.max(duree, maintenant ?? 0, 1);
  const pct = (m: number) => `${((m / echelle) * 100).toFixed(3)}%`;
  const voies = [...new Set(visibles.map((p) => p.voie))].sort((a, b) => {
    const [ta, na] = a.split(' ');
    const [tb, nb] = b.split(' ');
    return ORDRE.indexOf(ta ?? '') - ORDRE.indexOf(tb ?? '') || Number(na ?? 0) - Number(nb ?? 0);
  });
  const pas = echelle > 240 ? 60 : echelle > 120 ? 30 : 15;
  const tics: number[] = [];
  for (let m = 0; m <= echelle; m += pas) tics.push(m);

  const lignes = voies.map((voie) => {
    const barres = visibles.filter((p) => p.voie === voie).sort((a, b) => a.debut - b.debut);
    const pistes: number[] = [];
    const placees = barres.map((p) => {
      let i = pistes.findIndex((fin) => fin <= p.debut + 1e-6);
      if (i < 0) i = pistes.push(0) - 1;
      pistes[i] = p.fin;
      return { p, piste: i };
    });
    return { voie, placees, hauteur: Math.max(1, pistes.length) };
  });

  return (
    <div class="frise" style={{ '--maintenant': maintenant === null ? '-10%' : pct(maintenant) }}>
      <div class="frise-axe" aria-hidden="true">
        <div class="frise-voie" />
        <div class="frise-piste">
          {tics.map((m) => (
            <span key={m} class="tic" style={{ left: pct(m) }}>
              {heure(m)}
            </span>
          ))}
          {maintenant !== null && <span class="repere-maintenant">Maintenant</span>}
        </div>
      </div>
      {lignes.map(({ voie, placees, hauteur }) => (
        <div key={voie} class="frise-ligne">
          <div class="frise-voie">{libelleVoie(voie, cuisiniers)}</div>
          <div class="frise-piste" style={{ height: `${12 + hauteur * 40}px` }}>
            {placees.map(({ p, piste }) => {
              const t = parId.get(p.id);
              const etat = terminees.has(p.id)
                ? ' finie'
                : maintenant !== null && p.debut <= maintenant
                  ? ' en-cours'
                  : '';
              return (
                <div
                  key={p.id}
                  class={`etape-frise ${classeTache(t)}${t?.active ? '' : ' passive'}${etat}`}
                  style={{ left: pct(p.debut), width: pct(p.fin - p.debut), top: `${6 + piste * 40}px` }}
                  title={`${heure(p.debut)} · ${t?.texte ?? ''} · ${Math.round(p.fin - p.debut)} min`}
                >
                  <span>{t?.texte}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
