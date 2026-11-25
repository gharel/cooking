import { recettes } from '../app/bibliotheque-etat';
import { fournee, modifierFournee, modifierReglages, reglages } from '../app/fournee-etat';
import { Icone, type NomIcone } from '../app/icones';
import { ancreFiche } from '../app/routage';
import { listeDeCourses } from '../domaine/courses';
import { dateLongue, dateSansJour, jourCourt, nomDuJour, numeroDuJour } from '../domaine/dates';
import {
  alertes,
  changerDateSession,
  changerRepas,
  joursDeLaFournee,
  portionsTotales,
  repartir,
  repasCouverts,
  retirerPlat,
  type Alerte,
  type TypeAlerte,
} from '../domaine/fournee';
import { estCongelable } from '../domaine/modele';
import { teinte } from './recettes/commun';
import { Compteur, ouvrirChoixPlat } from './semaine/ChoixPlat';

const ICONES_ALERTES: Readonly<Record<TypeAlerte, NomIcone>> = {
  congeler: 'flocon',
  avancer: 'horloge',
  portions: 'bol',
  veille: 'calendrier',
};

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;
export const heureLisible = (h: string) =>
  h.replace(/^0?(\d+):(\d+)$/, (_, hh: string, mm: string) => (mm === '00' ? `${hh} h` : `${hh} h ${mm}`));

function ListeAlertes({ liste }: { liste: Alerte[] }) {
  if (liste.length === 0) return <p class="aide">Rien à signaler pour l’instant.</p>;
  return (
    <ul class="vigilance">
      {liste.map((a, i) => (
        <li
          key={`${a.type}-${a.recetteId}-${i}`}
          class={a.type === 'avancer' || a.type === 'portions' ? 'bientot' : ''}
        >
          <span class={`rond ${a.type}`}>
            <Icone nom={ICONES_ALERTES[a.type]} />
          </span>
          <div>
            <strong>{a.titre}</strong>
            <span>{a.detail}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Semaine() {
  const f = fournee.value;
  const { personnes, placard } = reglages.value;
  if (!f)
    return (
      <section class="vue" aria-labelledby="titre-semaine">
        <h1 id="titre-semaine" tabIndex={-1}>
          Ma semaine
        </h1>
        <p class="aide">Chargement…</p>
      </section>
    );

  const jours = joursDeLaFournee(f.sessionLe);
  const parId = new Map(recettes.value.map((r) => [r.id, r]));
  const plats = f.plats.filter((p) => parId.has(p.recetteId));
  const liste = alertes(f, recettes.value, personnes);
  const articles = listeDeCourses(plats, recettes.value, placard).total;

  return (
    <section class="vue" aria-labelledby="titre-semaine">
      <div class="entete">
        <div>
          <p class="surtitre">Fournée</p>
          <h1 id="titre-semaine" tabIndex={-1}>
            Semaine du {dateSansJour(jours[0] ?? f.sessionLe)} au {dateSansJour(jours[6] ?? f.sessionLe)}
          </h1>
          <p class="sous-titre">
            Foyer de {pluriel(personnes, 'personne')} · {pluriel(plats.length, 'plat')} ·{' '}
            {pluriel(portionsTotales(f), 'portion')}
          </p>
        </div>
        <div class="foyer">
          <span>Foyer</span>
          <Compteur
            valeur={personnes}
            max={12}
            libelle="Personnes au foyer"
            changer={(v) => void modifierReglages((r) => ({ ...r, personnes: v }))}
          />
        </div>
      </div>

      <div class="carte carte-session">
        <div>
          <p class="etiquette">
            <Icone nom="flamme" />
            Session {f.statut === 'session' ? 'en cours' : 'prévue'}
          </p>
          <h2>
            {dateLongue(f.sessionLe)} à {heureLisible(f.heure)}
          </h2>
          <div class="champs-session">
            <label class="champ champ-court">
              <span>Jour</span>
              <input
                type="date"
                value={f.sessionLe}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  if (v) void modifierFournee((x) => changerDateSession(x, v));
                }}
              />
            </label>
            <label class="champ champ-court">
              <span>Heure</span>
              <input
                type="time"
                value={f.heure}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  if (v) void modifierFournee((x) => ({ ...x, heure: v }));
                }}
              />
            </label>
          </div>
        </div>
        <div class="actions">
          <a class="bouton bouton-primaire" href="#session">
            <Icone nom="flamme" />
            {f.statut === 'session' ? 'Reprendre la session' : 'Préparer la session'}
          </a>
          <a class="bouton bouton-secondaire" href="#courses">
            <Icone nom="courses" />
            Voir les courses
          </a>
        </div>
      </div>

      <ul class="stats">
        <li class="stat">
          <span class="stat-valeur">
            {repasCouverts(f)}
            <small> sur 14</small>
          </span>
          <span class="stat-nom">repas couverts</span>
        </li>
        <li class="stat">
          <span class="stat-valeur">{portionsTotales(f)}</span>
          <span class="stat-nom">portions à cuisiner</span>
        </li>
        <li class="stat">
          <span class="stat-valeur">{articles}</span>
          <span class="stat-nom">articles à acheter</span>
        </li>
      </ul>

      <div class="grille-semaine">
        <section class="carte" aria-labelledby="titre-plats">
          <div class="carte-entete">
            <h2 id="titre-plats">Plats de la fournée</h2>
          </div>
          {plats.length === 0 && <p class="aide">Aucun plat pour l’instant : ajoutez ceux de la semaine.</p>}
          <ul class="liste-plats">
            {plats.map((p) => {
              const r = parId.get(p.recetteId);
              if (!r) return null;
              return (
                <li key={p.recetteId} class={`ligne-plat teinte-${teinte(r.id)}`}>
                  <div class="ligne-plat-texte">
                    <a href={ancreFiche(r.id)}>{r.nom}</a>
                    <span>
                      Frigo {r.conservation.frigoJours} jours ·{' '}
                      {estCongelable(r) ? 'congelable' : 'ne se congèle pas'}
                    </span>
                  </div>
                  <Compteur
                    valeur={p.portions}
                    libelle={`Portions de ${r.nom}`}
                    changer={(v) =>
                      void modifierFournee((x) => ({
                        ...x,
                        plats: x.plats.map((q) => (q.recetteId === r.id ? { ...q, portions: v } : q)),
                      }))
                    }
                  />
                  <button
                    type="button"
                    class="bouton bouton-icone bouton-discret"
                    aria-label={`Retirer ${r.nom} de la fournée`}
                    onClick={() => void modifierFournee((x) => retirerPlat(x, r.id))}
                  >
                    <Icone nom="croix" />
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" class="ajout" onClick={() => ouvrirChoixPlat(null)}>
            <Icone nom="plus" />
            Ajouter un plat
          </button>
        </section>

        <section class="carte" aria-labelledby="titre-vigilance">
          <div class="carte-entete">
            <h2 id="titre-vigilance">À surveiller</h2>
          </div>
          <ListeAlertes liste={liste} />
        </section>

        <section class="carte carte-repas" aria-labelledby="titre-repas">
          <div class="carte-entete">
            <h2 id="titre-repas">Repas de la semaine</h2>
            <button
              type="button"
              class="bouton bouton-secondaire bouton-petit"
              disabled={plats.length === 0}
              onClick={() => void modifierFournee((x) => repartir(x, recettes.value, personnes))}
            >
              <Icone nom="etincelles" />
              Répartir automatiquement
            </button>
          </div>
          <ol class="jours">
            {jours.map((jour) => (
              <li key={jour} class="jour">
                <h3>
                  {jourCourt(jour)} <span>{numeroDuJour(jour)}</span>
                </h3>
                {(['midi', 'soir'] as const).map((moment) => {
                  const index = f.repas.findIndex((r) => r.jour === jour && r.moment === moment);
                  const repas = f.repas[index];
                  const choisi = repas?.recetteId ?? '';
                  return (
                    <label
                      key={moment}
                      class={`repas${choisi ? ` teinte-${teinte(choisi)}` : ' repas-libre'}`}
                    >
                      <span class="moment">{moment === 'midi' ? 'Midi' : 'Soir'}</span>
                      <span class="repas-nom" aria-hidden="true">
                        {choisi ? (parId.get(choisi)?.nom ?? 'Libre') : 'Libre'}
                      </span>
                      <select
                        class="repas-choix"
                        aria-label={`Repas du ${nomDuJour(jour)} ${moment}`}
                        value={choisi}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          void modifierFournee((x) =>
                            changerRepas(x, index, { recetteId: v || null, platId: null }),
                          );
                        }}
                      >
                        <option value="">Libre</option>
                        {plats.map((p) => (
                          <option key={p.recetteId} value={p.recetteId}>
                            {parId.get(p.recetteId)?.nom}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}
