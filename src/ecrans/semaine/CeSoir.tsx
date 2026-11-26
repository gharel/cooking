import { useRef, useState } from 'preact/hooks';
import { reglages, modifierReglages } from '../../app/fournee-etat';
import { Icone } from '../../app/icones';
import { ancreFiche } from '../../app/routage';
import {
  activerRappelDiner,
  adresses,
  choisirPourCeSoir,
  dinerDeDemain,
  dinerDu,
  notificationsPossibles,
  telechargerAgenda,
} from '../../app/soir-etat';
import { heureLisible } from '../../domaine/dates';
import { teinte } from '../recettes/commun';
import { Adresses, LiensAdresse, Roulette } from './PlanB';

function Rappel() {
  const r = reglages.value;
  const [message, setMessage] = useState('');
  return (
    <details class="ce-soir-rappel">
      <summary>
        <Icone nom="cloche" />
        Être prévenu du dîner
      </summary>
      <div class="ce-soir-reglages">
        <label class="champ champ-court">
          <span>Heure du dîner</span>
          <input
            type="time"
            value={r.heureDiner}
            onChange={(e) => {
              const v = e.currentTarget.value;
              if (v) void modifierReglages((x) => ({ ...x, heureDiner: v }));
            }}
          />
        </label>
        <label class="case">
          <input
            type="checkbox"
            checked={r.notificationDiner}
            onChange={(e) => {
              const oui = e.currentTarget.checked;
              void activerRappelDiner(oui).then((p) =>
                setMessage(
                  p === 'denied'
                    ? 'Notifications refusées par le navigateur : ajoutez plutôt les dîners à l’agenda.'
                    : p === 'indisponible'
                      ? 'Ce navigateur ne permet pas les notifications (sur iPhone, installez d’abord Fournée sur l’écran d’accueil) : passez par l’agenda.'
                      : '',
                ),
              );
            }}
          />
          Me prévenir à l’heure du dîner
        </label>
        <button type="button" class="bouton bouton-secondaire bouton-petit" onClick={telechargerAgenda}>
          <Icone nom="calendrier" />
          Ajouter les dîners à mon agenda
        </button>
      </div>
      <p class="aide">
        {notificationsPossibles()
          ? 'La notification arrive tant que Fournée est ouverte ou en arrière-plan. '
          : ''}
        L’agenda, lui, prévient même application fermée : dîners de la semaine et plats à sortir du
        congélateur, avec leur alarme.
      </p>
      {message && (
        <p class="aide" role="status">
          {message}
        </p>
      )}
    </details>
  );
}

/** Widget « Ce soir » de l’écran d’accueil : le dîner prévu, sinon le plan B. */
export function CeSoir() {
  const [fenetre, setFenetre] = useState<'roulette' | 'adresses' | null>(null);
  const retour = useRef<HTMLElement | null>(null);
  const r = reglages.value;
  const d = dinerDu();
  const demain = dinerDeDemain();
  const adresse = d.adresseId ? adresses.value.find((a) => a.id === d.adresseId) : undefined;
  const choisi = r.choixDuSoir?.jour === d.jour;
  const ouvrir = (f: 'roulette' | 'adresses') => (e: Event) => {
    retour.current = e.currentTarget as HTMLElement;
    setFenetre(f);
  };
  const fermer = () => {
    setFenetre(null);
    queueMicrotask(() => retour.current?.isConnected && retour.current.focus());
  };
  return (
    <section
      class={`carte ce-soir${d.recetteId ? ` teinte-${teinte(d.recetteId)}` : ' ce-soir-libre'}`}
      aria-labelledby="titre-ce-soir"
    >
      <div class="ce-soir-texte">
        <p class="etiquette">
          <Icone nom="bol" />
          Ce soir · {heureLisible(r.heureDiner)}
        </p>
        <h2 id="titre-ce-soir">{d.nom ?? 'Rien de prévu'}</h2>
        <p class="aide">{d.conseil}</p>
        {demain.nom && (
          <p class="ce-soir-demain">
            Demain soir : {demain.source === 'dehors' ? 'à l’extérieur' : demain.nom}
          </p>
        )}
      </div>
      <div class="actions">
        {d.recetteId && (
          <a class="bouton bouton-primaire" href={ancreFiche(d.recetteId)}>
            <Icone nom="livre" />
            Voir la recette
          </a>
        )}
        {adresse && <LiensAdresse a={adresse} />}
        <button
          type="button"
          class={`bouton ${d.source === 'libre' ? 'bouton-primaire' : 'bouton-secondaire'}`}
          onClick={ouvrir('roulette')}
        >
          <Icone nom="des" />
          Roulette
        </button>
        <button type="button" class="bouton bouton-secondaire" onClick={ouvrir('adresses')}>
          <Icone nom="sac" />
          Nos adresses
        </button>
        {choisi && (
          <button type="button" class="bouton bouton-texte" onClick={() => void choisirPourCeSoir(null)}>
            Changer d’avis
          </button>
        )}
      </div>
      <Rappel />
      {fenetre === 'roulette' && <Roulette onFermer={fermer} />}
      {fenetre === 'adresses' && <Adresses onFermer={fermer} />}
    </section>
  );
}
