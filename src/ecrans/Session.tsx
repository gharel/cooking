import { useEffect, useRef, useState } from 'preact/hooks';
import { garderEcranAllume, sonner } from '../app/alarme';
import { annoncer } from '../app/annonces';
import { recettes } from '../app/bibliotheque-etat';
import { fournee, modifierFournee, modifierReglages, reglages } from '../app/fournee-etat';
import { Icone } from '../app/icones';
import {
  agir,
  demarrerHorloge,
  derniereSession,
  figer,
  horloge,
  lancerSession,
  planningCourant,
  terminerSession,
} from '../app/session-etat';
import { ajouterJours, dateLongue, versDate } from '../domaine/dates';
import type { Fournee } from '../domaine/fournee';
import { POSTES } from '../domaine/modele';
import type { Placement, Tache } from '../domaine/ordonnanceur';
import { estTerminee, nouvellesFigees, passer, prolonger, terminer } from '../domaine/session';
import { formaterDuree } from '../domaine/texte';
import { heureLisible } from './Semaine';
import { Compteur } from './semaine/ChoixPlat';
import { classeTache, Frise, libelleVoie } from './session/Frise';

const deux = (n: number) => String(n).padStart(2, '0');
const heureDe = (baseMs: number, minutes: number) => {
  const d = new Date(baseMs + minutes * 60_000);
  return d.getMinutes() === 0 ? `${d.getHours()} h` : `${d.getHours()} h ${deux(d.getMinutes())}`;
};
const compteARebours = (minutes: number) => {
  const s = Math.max(0, Math.round(minutes * 60));
  return `${deux(Math.floor(s / 60))}:${deux(s % 60)}`;
};
const debutPrevu = (f: Fournee) => {
  const [h, m] = f.heure.split(':').map(Number);
  const d = versDate(f.sessionLe);
  d.setHours(h ?? 14, m ?? 0, 0, 0);
  return d.getTime();
};

function nomsRecettes(t: Tache | undefined): string {
  if (!t) return '';
  return t.recettes.map((id) => recettes.value.find((r) => r.id === id)?.nom ?? '').join(' + ');
}

function Deroule({
  placements,
  taches,
  heure,
  faites,
}: {
  placements: Placement[];
  taches: Tache[];
  heure: (m: number) => string;
  faites: ReadonlySet<string>;
}) {
  const parId = new Map(taches.map((t) => [t.id, t]));
  return (
    <ol class="deroule">
      {[...placements]
        .sort((a, b) => a.debut - b.debut || a.voie.localeCompare(b.voie))
        .map((p) => {
          const t = parId.get(p.id);
          if (!t) return null;
          const zero = p.fin - p.debut < 1e-6 && t.prechauffage;
          return (
            <li key={p.id} class={`${classeTache(t)}${faites.has(p.id) ? ' faite' : ''}`}>
              <time>{heure(p.debut)}</time>
              <div>
                <strong>{zero ? `${t.texte} : four déjà chaud` : t.texte}</strong>
                <span>
                  {nomsRecettes(t)} · {POSTES[t.poste]} ·{' '}
                  {zero ? 'rien à faire' : formaterDuree(Math.round(t.duree))}
                  {t.active ? '' : ' (passif)'}
                  {t.facultative ? ' · facultative' : ''}
                </span>
              </div>
            </li>
          );
        })}
    </ol>
  );
}

function Preparation({ f }: { f: Fournee }) {
  const eq = reglages.value.equipement;
  const { planning } = planningCourant(f, recettes.value, eq, Date.now());
  const base = debutPrevu(f);
  const heure = (m: number) => heureDe(base, m);
  const gain = planning.sequentielle - planning.duree;
  const changerEq = (cle: keyof typeof eq) => (v: number) =>
    void modifierReglages((r) => ({ ...r, equipement: { ...r.equipement, [cle]: v } }));
  return (
    <>
      <div class="entete">
        <div>
          <p class="surtitre">Session</p>
          <h1 id="titre-session" tabIndex={-1}>
            Préparer la session
          </h1>
          <p class="sous-titre">
            {dateLongue(f.sessionLe)} à {heureLisible(f.heure)} · {f.plats.length} plat
            {f.plats.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div class="carte carte-session">
        <div>
          <p class="etiquette">
            <Icone nom="horloge" />
            Durée estimée
          </p>
          <h2>{formaterDuree(Math.round(planning.duree))}</h2>
          <p class="aide">
            {gain > 0
              ? `Au lieu de ${formaterDuree(Math.round(planning.sequentielle))} en enchaînant les recettes une à une : ${formaterDuree(Math.round(gain))} de gagnées.`
              : 'Les recettes se suivent : rien à gagner à les mener de front.'}{' '}
            Fin vers {heure(planning.duree)} si vous commencez à {heureLisible(f.heure)}.
          </p>
        </div>
        <div class="actions">
          <button
            type="button"
            class="bouton bouton-primaire bouton-grand"
            onClick={() => void lancerSession(recettes.value, eq)}
          >
            <Icone nom="flamme" />
            Lancer la session
          </button>
        </div>
      </div>

      <div class="grille-preparation">
        <section class="carte" aria-labelledby="titre-equipement">
          <h2 id="titre-equipement">Équipement</h2>
          <ul class="equipement">
            <li>
              <span>Feux</span>
              <Compteur valeur={eq.feux} max={8} libelle="Feux" changer={changerEq('feux')} />
            </li>
            <li>
              <span>Fours</span>
              <Compteur valeur={eq.fours} max={3} libelle="Fours" changer={changerEq('fours')} />
            </li>
            <li>
              <span>Cuisiniers</span>
              <Compteur
                valeur={eq.cuisiniers}
                max={3}
                libelle="Cuisiniers"
                changer={changerEq('cuisiniers')}
              />
            </li>
          </ul>
          <p class="aide">Un four accueille deux plats à la même température.</p>
        </section>
        <section class="carte" aria-labelledby="titre-veille">
          <h2 id="titre-veille">À faire la veille</h2>
          {planning.veille.length === 0 ? (
            <p class="aide">Rien à préparer la veille.</p>
          ) : (
            <>
              <p class="aide">{dateLongue(ajouterJours(f.sessionLe, -1))}</p>
              <ul class="veille">
                {planning.veille.map((v) => (
                  <li key={v.id}>
                    <label class="case">
                      <input
                        type="checkbox"
                        checked={f.veilleFaite.includes(v.id)}
                        onChange={(e) => {
                          const oui = e.currentTarget.checked;
                          void modifierFournee((x) => ({
                            ...x,
                            veilleFaite: oui
                              ? [...x.veilleFaite, v.id]
                              : x.veilleFaite.filter((i) => i !== v.id),
                          }));
                        }}
                      />
                      {recettes.value.find((r) => r.id === v.recetteId)?.nom} : {v.texte}
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <figure class="carte chronologie">
        <figcaption>
          <h2>Déroulé prévu</h2>
          <p class="aide">Hachuré : le plat cuit seul, vous êtes libre pour la suite.</p>
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
            maintenant={null}
            heure={heure}
            cuisiniers={eq.cuisiniers}
            terminees={new Set()}
          />
        </div>
      </figure>
      <section class="carte" aria-labelledby="titre-deroule">
        <h2 id="titre-deroule">Toutes les étapes, dans l’ordre</h2>
        <Deroule placements={planning.placements} taches={planning.taches} heure={heure} faites={new Set()} />
      </section>
    </>
  );
}

function EnCours({ f }: { f: Fournee }) {
  const s = f.session;
  const [modeCuisine, setModeCuisine] = useState(false);
  const signales = useRef(new Set<string>());
  useEffect(demarrerHorloge, []);
  useEffect(() => {
    void garderEcranAllume(true);
  }, []);
  const maintenantMs = horloge.value;
  const eq = reglages.value.equipement;
  const { planning, m } = planningCourant(f, recettes.value, eq, maintenantMs);

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
                <p class="etiquette">Maintenant · {libelleVoie(p.voie, eq.cuisiniers)}</p>
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
                        {nomsRecettes(t)} · {libelleVoie(p.voie, eq.cuisiniers)}
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
                return (
                  <li key={p.id} class={classeTache(t)}>
                    <time>{heure(p.debut)}</time>
                    <div>
                      <strong>{t?.texte}</strong>
                      <span>
                        {nomsRecettes(t)} · {formaterDuree(Math.round(t?.duree ?? 0))}
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
            cuisiniers={eq.cuisiniers}
            terminees={finies}
          />
        </div>
      </figure>
    </div>
  );
}

function Bilan({ f }: { f: Fournee }) {
  const b = f.bilan;
  if (!b) return null;
  const gain = b.dureeSequentielle - b.dureeReelle;
  return (
    <section class="carte bilan" aria-labelledby="titre-bilan">
      <p class="etiquette">
        <Icone nom="valider" />
        Dernière session
      </p>
      <h2 id="titre-bilan">
        Terminée en {formaterDuree(b.dureeReelle)} (prévue {formaterDuree(b.dureePrevue)})
      </h2>
      <p class="aide">
        {b.plats} plats, {b.portions} portions.{' '}
        {gain > 0 ? `${formaterDuree(gain)} gagnées par rapport aux recettes enchaînées une à une.` : ''}
      </p>
      <a class="bouton bouton-secondaire" href="#frigo">
        <Icone nom="frigo" />
        Voir le frigo
      </a>
    </section>
  );
}

export function Session() {
  const f = fournee.value;
  const derniere = derniereSession.value;
  return (
    <section class="vue vue-session" aria-labelledby="titre-session">
      {!f ? (
        <h1 id="titre-session" tabIndex={-1}>
          Session
        </h1>
      ) : f.statut === 'session' ? (
        <EnCours f={f} />
      ) : f.plats.length > 0 ? (
        <>
          <Preparation f={f} />
          {derniere && <Bilan f={derniere} />}
        </>
      ) : (
        <>
          <div class="entete">
            <div>
              <p class="surtitre">Session</p>
              <h1 id="titre-session" tabIndex={-1}>
                Session
              </h1>
              <p class="sous-titre">Choisissez d’abord les plats de la fournée.</p>
            </div>
          </div>
          {derniere && <Bilan f={derniere} />}
          <div class="carte a-venir">
            <span class="rond">
              <Icone nom="calendrier" />
            </span>
            <div class="a-venir-texte">
              <h2>Aucun plat dans la fournée</h2>
              <p>Le déroulé se calcule à partir des plats choisis pour la semaine.</p>
              <a class="bouton bouton-primaire" href="#semaine">
                <Icone nom="calendrier" />
                Choisir les plats
              </a>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
