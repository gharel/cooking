import { recettes } from '../../app/bibliotheque-etat';
import { modifierFournee, modifierReglages, reglages } from '../../app/fournee-etat';
import { Icone } from '../../app/icones';
import { lancerSession, planningCourant } from '../../app/session-etat';
import { ajouterJours, dateLongue, heureLisible } from '../../domaine/dates';
import type { Fournee } from '../../domaine/fournee';
import { POSTES } from '../../domaine/modele';
import { DEPART, type OptionsSession, type Placement, type Tache } from '../../domaine/ordonnanceur';
import { equipementDeSession } from '../../domaine/reglages';
import { formaterDuree } from '../../domaine/texte';
import { Compteur } from '../semaine/ChoixPlat';
import { classeTache, Frise, nomParticipant, quiFait } from './Frise';
import { debutPrevu, heureDe, nomsRecettes } from './commun';

const MAX_PARTICIPANTS = 4;

export function Deroule({
  placements,
  taches,
  heure,
  faites,
  participants,
}: {
  placements: Placement[];
  taches: Tache[];
  heure: (m: number) => string;
  faites: ReadonlySet<string>;
  participants: readonly string[];
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
          const qui = quiFait(p, participants);
          const recettesTache = nomsRecettes(t);
          return (
            <li key={p.id} class={`${classeTache(t)}${faites.has(p.id) ? ' faite' : ''}`}>
              <time>{heure(p.debut)}</time>
              <div>
                <strong>{zero ? `${t.texte} : four déjà chaud` : t.texte}</strong>
                <span>
                  {qui && t.active ? `${qui} · ` : ''}
                  {recettesTache ? `${recettesTache} · ` : ''}
                  {POSTES[t.poste]} · {zero ? 'rien à faire' : formaterDuree(Math.round(t.duree))}
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

export function Participants() {
  const liste = reglages.value.participants;
  const changer = (modification: (ps: string[]) => string[]) =>
    void modifierReglages((r) => ({ ...r, participants: modification(r.participants) }));
  return (
    <section class="carte" aria-labelledby="titre-participants">
      <h2 id="titre-participants">Qui cuisine ?</h2>
      <ul class="participants">
        {liste.map((nom, i) => (
          <li key={i}>
            <label>
              <span class="visuellement-cache">Prénom de la personne {i + 1}</span>
              <input
                type="text"
                value={nom}
                maxLength={30}
                autoComplete="off"
                placeholder={`Personne ${i + 1}`}
                onInput={(e) => {
                  const valeur = e.currentTarget.value;
                  changer((ps) => ps.map((x, j) => (j === i ? valeur : x)));
                }}
              />
            </label>
            {liste.length > 1 && (
              <button
                type="button"
                class="bouton bouton-texte bouton-icone"
                aria-label={`Retirer ${nomParticipant(liste, i + 1)}`}
                onClick={() => changer((ps) => ps.filter((_, j) => j !== i))}
              >
                <Icone nom="croix" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {liste.length < MAX_PARTICIPANTS && (
        <button
          type="button"
          class="bouton bouton-secondaire bouton-petit"
          onClick={() => changer((ps) => [...ps, ''])}
        >
          <Icone nom="plus" />
          Ajouter une personne
        </button>
      )}
      <p class="aide">
        {liste.length > 1
          ? 'Les étapes sont réparties pour finir au plus tôt : chacun voit les siennes, avec son prénom.'
          : 'Ajoutez les personnes qui cuisinent avec vous : les étapes seront réparties entre vous.'}
      </p>
    </section>
  );
}

/** Qui fait quoi : les étapes actives de chacun, dans l’ordre, avec le temps de travail. */
export function Repartition({
  placements,
  taches,
  heure,
  participants,
}: {
  placements: Placement[];
  taches: Tache[];
  heure: (m: number) => string;
  participants: readonly string[];
}) {
  const parId = new Map(taches.map((t) => [t.id, t]));
  const actives = placements
    .filter((p) => parId.get(p.id)?.active && p.fin - p.debut > 1e-6)
    .sort((a, b) => a.debut - b.debut);
  return (
    <section class="carte" aria-labelledby="titre-repartition">
      <h2 id="titre-repartition">Qui fait quoi</h2>
      <div class="repartition">
        {participants.map((_, i) => {
          const n = i + 1;
          const siennes = actives.filter((p) => p.id === DEPART || p.cuisinier === n);
          const travail = siennes.reduce((s, p) => s + (p.fin - p.debut), 0);
          return (
            <section key={n} class="repartition-personne" aria-labelledby={`titre-personne-${n}`}>
              <h3 id={`titre-personne-${n}`}>{nomParticipant(participants, n)}</h3>
              <p class="aide">
                {siennes.length} étape{siennes.length > 1 ? 's' : ''} · {formaterDuree(Math.round(travail))}{' '}
                de travail
              </p>
              <ol class="suite">
                {siennes.map((p) => {
                  const t = parId.get(p.id);
                  return (
                    <li key={p.id} class={classeTache(t)}>
                      <time>{heure(p.debut)}</time>
                      <div>
                        <strong>{t?.texte}</strong>
                        <span>
                          {[nomsRecettes(t), formaterDuree(Math.round(p.fin - p.debut))]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </section>
  );
}

export function Preparation({ f }: { f: Fournee }) {
  const r = reglages.value;
  const eq = equipementDeSession(r);
  const options: OptionsSession = { hygiene: true, laveVaisselle: r.laveVaisselle };
  const { planning } = planningCourant(f, recettes.value, eq, options, Date.now());
  const base = debutPrevu(f);
  const heure = (m: number) => heureDe(base, m);
  const gain = planning.sequentielle - planning.duree;
  const changerEq = (cle: 'feux' | 'fours') => (v: number) =>
    void modifierReglages((x) => ({ ...x, equipement: { ...x.equipement, [cle]: v } }));
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
            onClick={() => void lancerSession(recettes.value, eq, options)}
          >
            <Icone nom="flamme" />
            Lancer la session
          </button>
        </div>
      </div>

      <div class="grille-preparation">
        <Participants />
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
          </ul>
          <label class="case">
            <input
              type="checkbox"
              checked={r.laveVaisselle}
              onChange={(e) => {
                const oui = e.currentTarget.checked;
                void modifierReglages((x) => ({ ...x, laveVaisselle: oui }));
              }}
            />
            Lave-vaisselle
          </label>
          <p class="aide">
            Un four accueille deux plats à la même température. Le déroulé compte le lavage des mains, la
            vaisselle {r.laveVaisselle ? '(lave-vaisselle) ' : 'à la main '}et le nettoyage du plan de
            travail.
          </p>
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
            participants={r.participants}
            terminees={new Set()}
          />
        </div>
      </figure>
      {r.participants.length > 1 && (
        <Repartition
          placements={planning.placements}
          taches={planning.taches}
          heure={heure}
          participants={r.participants}
        />
      )}
      <section class="carte" aria-labelledby="titre-deroule">
        <h2 id="titre-deroule">Toutes les étapes, dans l’ordre</h2>
        <Deroule
          placements={planning.placements}
          taches={planning.taches}
          heure={heure}
          faites={new Set()}
          participants={r.participants}
        />
      </section>
    </>
  );
}
