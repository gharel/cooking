import { recettes } from '../app/bibliotheque-etat';
import { fournee, modifierFournee, modifierReglages, reglages } from '../app/fournee-etat';
import { Icone, type NomIcone } from '../app/icones';
import { ancreFiche } from '../app/routage';
import { listeDeCourses } from '../domaine/courses';
import { dateLongue, dateSansJour, heureLisible, jourCourt, nomDuJour, numeroDuJour } from '../domaine/dates';
import { platsDuSoir } from '../domaine/soir';
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
import { rappelsDecongelation } from '../domaine/stock';
import { derniereSession, historique } from '../app/session-etat';
import { statistiques, texteDeLaFournee } from '../domaine/partage';
import { formaterDuree } from '../domaine/texte';
import { partagerTexte } from '../app/partager';
import { plats as platsStock } from '../app/stock-etat';
import { aujourdhui } from '../domaine/dates';
import { teinte } from './recettes/commun';
import { CeSoir } from './semaine/CeSoir';
import { Compteur, ouvrirChoixPlat } from './semaine/ChoixPlat';

const ICONES_ALERTES: Readonly<Record<TypeAlerte, NomIcone>> = {
  congeler: 'flocon',
  avancer: 'horloge',
  portions: 'bol',
  veille: 'calendrier',
};

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

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
  const stock = platsStock.value;
  const stats = statistiques(historique.value);
  const liste = alertes(f, recettes.value, personnes);
  const rappels = rappelsDecongelation(
    [f, derniereSession.value].filter((x) => x !== null),
    stock,
    recettes.value,
    personnes,
    aujourdhui(),
  );
  const duSoir = platsDuSoir(f, recettes.value, personnes);
  const articles = listeDeCourses([...plats, ...duSoir], recettes.value, placard).total;
  const enPlats = new Set(plats.map((p) => p.recetteId));
  const recettesDuSoir = recettes.value.filter((r) => r.soir && !enPlats.has(r.id));

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

      <CeSoir />

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
          <button
            type="button"
            class="bouton bouton-secondaire"
            disabled={plats.length === 0}
            onClick={() =>
              void partagerTexte('Fournée', texteDeLaFournee(f, recettes.value, stock, heureLisible(f.heure)))
            }
          >
            <Icone nom="partage" />
            Partager la fournée
          </button>
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

      {stats.sessions > 0 && (
        <section class="carte carte-stats" aria-labelledby="titre-stats">
          <h2 id="titre-stats">Vos fournées</h2>
          <p>
            {stats.sessions} session{stats.sessions > 1 ? 's' : ''} · {formaterDuree(stats.tempsGagne)}{' '}
            gagnées en menant les recettes de front · {stats.plats} plats, {stats.portions} portions ·{' '}
            {formaterDuree(stats.dureeMoyenne)} par session en moyenne
          </p>
        </section>
      )}

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
          {rappels.length > 0 && (
            <ul class="vigilance rappels-semaine">
              {rappels.map((r) => (
                <li key={r.texte}>
                  <span class="rond congeler">
                    <Icone nom="flocon" />
                  </span>
                  <div>
                    <strong>À sortir du congélateur</strong>
                    <span>{r.texte}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
                  const choisi = repas?.platId
                    ? `p:${repas.platId}`
                    : repas?.recetteId
                      ? `r:${repas.recetteId}`
                      : '';
                  const platStock = repas?.platId ? stock.find((x) => x.id === repas.platId) : undefined;
                  const nomChoisi = platStock
                    ? `${platStock.nom} (${platStock.lieu === 'frigo' ? 'frigo' : 'congélateur'})`
                    : repas?.recetteId
                      ? (parId.get(repas.recetteId)?.nom ?? 'Libre')
                      : 'Libre';
                  const teinteChoisie = platStock?.recetteId ?? repas?.recetteId ?? '';
                  return (
                    <label
                      key={moment}
                      class={`repas${choisi ? ` teinte-${teinte(teinteChoisie || choisi)}` : ' repas-libre'}`}
                    >
                      <span class="moment">{moment === 'midi' ? 'Midi' : 'Soir'}</span>
                      <span class="repas-nom" aria-hidden="true">
                        {nomChoisi}
                      </span>
                      <select
                        class="repas-choix"
                        aria-label={`Repas du ${nomDuJour(jour)} ${moment}`}
                        value={choisi}
                        onChange={(e) => {
                          const v = e.currentTarget.value;
                          void modifierFournee((x) =>
                            changerRepas(x, index, {
                              recetteId: v.startsWith('r:') ? v.slice(2) : null,
                              platId: v.startsWith('p:') ? v.slice(2) : null,
                            }),
                          );
                        }}
                      >
                        <option value="">Libre</option>
                        {plats.length > 0 && (
                          <optgroup label="Plats de la fournée">
                            {plats.map((p) => (
                              <option key={p.recetteId} value={`r:${p.recetteId}`}>
                                {parId.get(p.recetteId)?.nom}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {recettesDuSoir.length > 0 && (
                          <optgroup label="Recettes du soir (le jour même)">
                            {recettesDuSoir.map((r) => (
                              <option key={r.id} value={`r:${r.id}`}>
                                {r.nom}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {stock.length > 0 && (
                          <optgroup label="Déjà au frigo ou au congélateur">
                            {stock.map((p) => (
                              <option key={p.id} value={`p:${p.id}`}>
                                {p.nom} ({p.lieu === 'frigo' ? 'frigo' : 'congélateur'}, {p.portions}{' '}
                                portions)
                              </option>
                            ))}
                          </optgroup>
                        )}
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
