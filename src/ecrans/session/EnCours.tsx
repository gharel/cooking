import { useEffect, useRef, useState } from 'preact/hooks';
import { garderEcranAllume, sonner } from '../../app/alarme';
import { annoncer } from '../../app/annonces';
import { recettes } from '../../app/bibliotheque-etat';
import { reglages } from '../../app/fournee-etat';
import { Icone } from '../../app/icones';
import {
  agir,
  demarrerHorloge,
  figer,
  horloge,
  planningCourant,
  terminerSession,
} from '../../app/session-etat';
import type { Fournee } from '../../domaine/fournee';
import { equipementDeSession } from '../../domaine/reglages';
import { estTerminee, nouvellesFigees, passer, prolonger, terminer } from '../../domaine/session';
import { formaterDuree } from '../../domaine/texte';
import { classeTache, Frise, libellePlace, quiFait } from './Frise';
import { compteARebours, heureDe, nomsRecettes } from './commun';

export function EnCours({ f }: { f: Fournee }) {
  const s = f.session;
  const [modeCuisine, setModeCuisine] = useState(false);
  const signales = useRef(new Set<string>());
  useEffect(demarrerHorloge, []);
  useEffect(() => {
    void garderEcranAllume(true);
  }, []);
  const maintenantMs = horloge.value;
  const participants = reglages.value.participants;
  const eq = equipementDeSession(reglages.value);
  const { planning, m } = planningCourant(
    f,
    recettes.value,
    eq,
    { hygiene: true, laveVaisselle: reglages.value.laveVaisselle },
    maintenantMs,
  );

  // Les tâches qui commencent vraiment sont figées : le plan ne les déplacera plus.
  const nouvelles = s ? nouvellesFigees(s, planning, m) : [];
  useEffect(() => {
    if (nouvelles.length) void figer(nouvelles);
  }, [nouvelles.map((p) => p.id).join()]);

  const finies = new Set(
    planning.taches.filter((t) => s && estTerminee(s, planning.taches, t.id, m)).map((t) => t.id),
  );
  // Signal à la fin d’un minuteur.
  useEffect(() => {
    for (const t of planning.taches) {
      if (!t.active && finies.has(t.id) && s?.figees[t.id] && !signales.current.has(t.id)) {
        signales.current.add(t.id);
        if (!s.faites.includes(t.id)) sonner(`Terminé : ${t.texte}`);
      }
    }
  });
  if (!s) return null;

  const parId = new Map(planning.taches.map((t) => [t.id, t]));
  const heure = (x: number) => heureDe(s.debut, x);
  // Les tâches qui commencent à l’instant comptent déjà comme en cours (elles seront figées au prochain tour).
  const enCours = [...Object.values(s.figees), ...nouvelles].filter((p) => !finies.has(p.id));
  const actuelles = enCours
    .filter((p) => parId.get(p.id)?.active)
    .sort((a, b) => (a.cuisinier ?? 0) - (b.cuisinier ?? 0));
  const minuteurs = enCours
    .filter((p) => !parId.get(p.id)?.active && p.fin - p.debut > 1e-6)
    .sort((a, b) => a.fin - b.fin);
  const aVenir = planning.placements.filter((p) => !s.figees[p.id]).sort((a, b) => a.debut - b.debut);
  const prochaineActive = aVenir.find((p) => parId.get(p.id)?.active);
  const total = planning.taches.length;
  const fini = finies.size === total;
  const placementDe = (id: string) => planning.placements.find((p) => p.id === id);

  async function finir() {
    if (!fini && !confirm('Des étapes ne sont pas terminées. Terminer quand même la session ?')) return;
    const n = await terminerSession(recettes.value, reglages.value.personnes);
    annoncer(
      `Session terminée : ${n} plat${n > 1 ? 's' : ''} rangé${n > 1 ? 's' : ''} au frigo ou au congélateur.`,
    );
  }

  return (
    <div class={modeCuisine ? 'mode-cuisine' : undefined}>
      <div class="entete">
        <div>
          <p class="surtitre">
            <span class="point-direct" />
            En cours
          </p>
          <h1 id="titre-session" tabIndex={-1}>
            Session en cours
          </h1>
          <p class="sous-titre">
            Démarrée à {heure(0)} · fin estimée à {heure(planning.duree)}
          </p>
        </div>
        <div class="actions">
          <button
            type="button"
            class="bouton bouton-secondaire"
            aria-pressed={modeCuisine ? 'true' : 'false'}
            onClick={() => setModeCuisine(!modeCuisine)}
          >
            <Icone nom="agrandir" />
            Mode cuisine
          </button>
          <button
            type="button"
            class={`bouton ${fini ? 'bouton-primaire' : 'bouton-secondaire'}`}
            onClick={() => void finir()}
          >
            <Icone nom="frigo" />
            Terminer la session
          </button>
        </div>
      </div>

      <div class="carte progression-session">
        <p class="progression-texte">
          <span>
            <strong>
              {finies.size} étape{finies.size > 1 ? 's' : ''} sur {total}
            </strong>
          </span>
          <span>
            {Math.floor(m)} min écoulées · {Math.max(0, Math.round(planning.duree - m))} min restantes
          </span>
        </p>
        <div class="jauge">
          <span style={{ width: `${total ? (finies.size / total) * 100 : 0}%` }} />
        </div>
      </div>

      <div class="grille-session">
        <div class="colonne-maintenant">
          {actuelles.length === 0 && (
            <article class="carte maintenant" aria-labelledby="titre-maintenant">
              <p class="etiquette">Maintenant</p>
              <h2 id="titre-maintenant" aria-live="polite">
                {fini
                  ? 'Tout est prêt : rangez les plats.'
                  : prochaineActive
                    ? `Pause : prochaine étape à ${heure(prochaineActive.debut)}`
                    : 'Les cuissons avancent seules.'}
              </h2>
              {prochaineActive && <p class="maintenant-detail">{parId.get(prochaineActive.id)?.texte}</p>}
            </article>
          )}
          {actuelles.map((p) => {
            const t = parId.get(p.id);
            if (!t) return null;
            return (
              <article
                key={p.id}
                class={`carte maintenant ${classeTache(t)}`}
                aria-labelledby={`maintenant-${p.cuisinier}`}
              >
                <p class="etiquette">Maintenant · {libellePlace(p, participants)}</p>
                <h2 id={`maintenant-${p.cuisinier}`} aria-live="polite">
                  {t.texte}
                </h2>
                <ul class="meta">
                  <li>{nomsRecettes(t)}</li>
                  <li>
                    <Icone nom="horloge" />
                    {p.fin > m ? `${Math.ceil(p.fin - m)} min prévues` : 'Temps prévu écoulé'}
                  </li>
                </ul>
                <div class="actions">
                  <button
                    type="button"
                    class="bouton bouton-primaire bouton-grand"
                    onClick={() => void agir((x, mm) => terminer(x, p.id, mm))}
                  >
                    <Icone nom="valider" />
                    Étape terminée
                  </button>
                  <button
                    type="button"
                    class="bouton bouton-secondaire bouton-grand"
                    onClick={() => void agir((x, mm) => prolonger(x, p.id, mm, 5))}
                  >
                    +5 min
                  </button>
                  {t.facultative && (
                    <button
                      type="button"
                      class="bouton bouton-secondaire bouton-grand"
                      onClick={() => void agir((x, mm) => passer(x, p.id, mm, p))}
                    >
                      Passer
                    </button>
                  )}
                </div>
                <p class="note-ecran">Écran maintenu allumé pendant la session</p>
              </article>
            );
          })}
        </div>

        <section class="carte minuteurs" aria-labelledby="titre-minuteurs">
          <h2 id="titre-minuteurs">Minuteurs</h2>
          {minuteurs.length === 0 ? (
            <p class="aide">Aucune cuisson en cours.</p>
          ) : (
            <ul>
              {minuteurs.map((p) => {
                const t = parId.get(p.id);
                const reste = p.fin - m;
                return (
                  <li
                    key={p.id}
                    class={`minuteur ${classeTache(t)}${reste <= 1 ? ' urgent' : reste <= 10 ? ' bientot' : ''}`}
                  >
                    <span class="minuteur-texte">
                      <strong>{t?.texte}</strong>
                      <span>
                        {nomsRecettes(t)} · {libellePlace(p, participants)}
                        {p.temperature ? ` · ${p.temperature} °C` : ''}
                      </span>
                    </span>
                    <span
                      class="minuteur-temps"
                      role="timer"
                      aria-label={`Reste ${Math.ceil(reste)} minutes`}
                    >
                      {compteARebours(reste)}
                    </span>
                    <button
                      type="button"
                      class="bouton bouton-secondaire bouton-petit"
                      onClick={() => void agir((x, mm) => terminer(x, p.id, mm))}
                    >
                      Terminé
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section class="carte ensuite" aria-labelledby="titre-ensuite">
          <h2 id="titre-ensuite">Ensuite</h2>
          {aVenir.length === 0 ? (
            <p class="aide">Plus rien à commencer.</p>
          ) : (
            <ol class="suite">
              {aVenir.slice(0, 6).map((p) => {
                const t = parId.get(p.id);
                const qui = t?.active ? quiFait(p, participants) : null;
                return (
                  <li key={p.id} class={classeTache(t)}>
                    <time>{heure(p.debut)}</time>
                    <div>
                      <strong>{t?.texte}</strong>
                      <span>
                        {[qui, nomsRecettes(t), formaterDuree(Math.round(t?.duree ?? 0))]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      {t?.facultative && (
                        <button
                          type="button"
                          class="bouton bouton-texte bouton-petit"
                          onClick={() => {
                            const pl = placementDe(p.id);
                            if (pl) void agir((x, mm) => passer(x, p.id, mm, pl));
                          }}
                        >
                          Passer cette étape facultative
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <figure class="carte chronologie">
        <figcaption>
          <h2>Déroulé de la session</h2>
        </figcaption>
        <div
          class="frise-defilement"
          tabIndex={0}
          role="region"
          aria-label="Frise de la session, à faire défiler"
        >
          <Frise
            taches={planning.taches}
            placements={planning.placements}
            duree={planning.duree}
            maintenant={m}
            heure={heure}
            participants={participants}
            terminees={finies}
          />
        </div>
      </figure>
    </div>
  );
}
