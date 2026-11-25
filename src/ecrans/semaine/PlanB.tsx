import { useEffect, useRef, useState } from 'preact/hooks';
import { annoncer } from '../../app/annonces';
import { recettes } from '../../app/bibliotheque-etat';
import { Dialogue } from '../../app/Dialogue';
import { Icone } from '../../app/icones';
import { ancreFiche } from '../../app/routage';
import { adresses, choisirPourCeSoir, garderAdresse, oublierAdresse } from '../../app/soir-etat';
import {
  hasard,
  lienItineraire,
  lienTelephone,
  normaliserLien,
  optionsRoulette,
  tirer,
  type Adresse,
  type FiltreRoulette,
  type OptionRoulette,
} from '../../domaine/soir';
import { nouvelIdentifiant } from '../../donnees/base';

/** Appeler, itinéraire, site : ce qu’on fait d’une adresse. */
export function LiensAdresse({ a }: { a: Adresse }) {
  return (
    <>
      {a.telephone && (
        <a
          class="bouton bouton-secondaire bouton-petit"
          href={lienTelephone(a)}
          aria-label={`Appeler ${a.nom}`}
        >
          <Icone nom="telephone" />
          Appeler
        </a>
      )}
      <a
        class="bouton bouton-secondaire bouton-petit"
        href={lienItineraire(a)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Itinéraire vers ${a.nom} (nouvel onglet)`}
      >
        <Icone nom="repere" />
        Itinéraire
      </a>
      {a.lien && (
        <a
          class="bouton bouton-secondaire bouton-petit"
          href={a.lien}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Site de ${a.nom} (nouvel onglet)`}
        >
          <Icone nom="lien" />
          Site
        </a>
      )}
    </>
  );
}

const FILTRES: readonly { id: FiltreRoulette; nom: string }[] = [
  { id: 'tout', nom: 'Tout' },
  { id: 'cuisiner', nom: 'À cuisiner' },
  { id: 'chercher', nom: 'À aller chercher' },
];

const animationsReduites = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Roulette : tirage au hasard parmi les recettes du soir et les adresses, pour décider sans débat. */
export function Roulette({ onFermer }: { onFermer: () => void }) {
  const [filtre, setFiltre] = useState<FiltreRoulette>('tout');
  const [affiche, setAffiche] = useState<OptionRoulette | null>(null);
  const [tourne, setTourne] = useState(false);
  const minuterie = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => () => clearInterval(minuterie.current), []);
  const options = optionsRoulette(recettes.value, adresses.value, filtre);

  function lancer() {
    const resultat = tirer(options, hasard);
    if (!resultat) return;
    clearInterval(minuterie.current);
    if (animationsReduites() || options.length < 2) {
      setAffiche(resultat);
      return;
    }
    setTourne(true);
    let tours = 0;
    minuterie.current = setInterval(() => {
      tours++;
      if (tours >= 14) {
        clearInterval(minuterie.current);
        setAffiche(resultat);
        setTourne(false);
      } else setAffiche(options[tours % options.length] ?? resultat);
    }, 80);
  }

  async function retenir(o: OptionRoulette) {
    await choisirPourCeSoir(
      o.type === 'recette' ? { recetteId: o.id, adresseId: null } : { recetteId: null, adresseId: o.id },
    );
    annoncer(`Ce soir : ${o.nom}.`);
    onFermer();
  }

  const adresse = affiche?.type === 'adresse' ? adresses.value.find((a) => a.id === affiche.id) : undefined;
  return (
    <Dialogue id="titre-roulette" surtitre="Ce soir" titre="Roulette" onFermer={onFermer} etroit>
      <div class="puces-filtre" role="group" aria-label="Tirer parmi">
        {FILTRES.map((f) => (
          <button
            key={f.id}
            type="button"
            class="puce-filtre"
            aria-pressed={filtre === f.id ? 'true' : 'false'}
            onClick={() => {
              setFiltre(f.id);
              setAffiche(null);
            }}
          >
            {f.nom}
          </button>
        ))}
      </div>
      <p class="aide">
        {options.length} possibilité{options.length > 1 ? 's' : ''} : les recettes du soir et vos adresses.
      </p>
      <div
        class={`roulette${tourne ? ' tourne' : ''}`}
        aria-live="polite"
        aria-busy={tourne ? 'true' : 'false'}
      >
        {affiche ? (
          <>
            <p class="roulette-nom">{affiche.nom}</p>
            <p class="aide">{affiche.detail}</p>
          </>
        ) : (
          <p class="aide">
            {options.length ? 'Lancez la roulette : elle décide pour vous.' : 'Rien à tirer avec ce filtre.'}
          </p>
        )}
      </div>
      <div class="actions">
        <button
          type="button"
          class={`bouton ${affiche && !tourne ? 'bouton-secondaire' : 'bouton-primaire'}`}
          disabled={options.length === 0 || tourne}
          onClick={lancer}
        >
          <Icone nom="des" />
          {affiche ? 'Relancer' : 'Lancer la roulette'}
        </button>
        {affiche && !tourne && (
          <button type="button" class="bouton bouton-primaire" onClick={() => void retenir(affiche)}>
            <Icone nom="valider" />
            Ce soir, c’est ça
          </button>
        )}
      </div>
      {affiche && !tourne && (
        <div class="actions roulette-liens">
          {affiche.type === 'recette' && (
            <a class="bouton bouton-secondaire bouton-petit" href={ancreFiche(affiche.id)} onClick={onFermer}>
              <Icone nom="livre" />
              Voir la recette
            </a>
          )}
          {adresse && <LiensAdresse a={adresse} />}
        </div>
      )}
    </Dialogue>
  );
}

const VIDE: Adresse = { id: '', nom: '', type: '', adresse: '', telephone: '', lien: '' };

function FormulaireAdresse({
  depart,
  onFini,
}: {
  depart: Adresse;
  onFini: (enregistree: Adresse | null) => void;
}) {
  const [a, setA] = useState(depart);
  const champ = (
    cle: keyof Omit<Adresse, 'id'>,
    libelle: string,
    clavier: 'text' | 'tel' | 'url' = 'text',
    aide = '',
  ) => (
    <label class="champ">
      <span>{libelle}</span>
      <input
        type="text"
        inputMode={clavier}
        value={a[cle]}
        required={cle === 'nom'}
        maxLength={cle === 'lien' ? 300 : 80}
        placeholder={aide}
        autoComplete="off"
        onInput={(e) => {
          const v = e.currentTarget.value;
          setA((x) => ({ ...x, [cle]: v }));
        }}
      />
    </label>
  );
  return (
    <form
      class="formulaire-adresse"
      onSubmit={(e) => {
        e.preventDefault();
        if (!a.nom.trim()) return;
        const enregistree = { ...a, id: a.id || nouvelIdentifiant('adresse'), lien: normaliserLien(a.lien) };
        void garderAdresse(enregistree).then(() => onFini(enregistree));
      }}
    >
      {champ('nom', 'Nom', 'text', 'Le snack du coin')}
      {champ('type', 'Type', 'text', 'Pizzas, sushis, burgers…')}
      {champ('adresse', 'Adresse', 'text', 'Pour l’itinéraire')}
      <div class="champs-ligne">
        {champ('telephone', 'Téléphone', 'tel')}
        {champ('lien', 'Site ou menu', 'url', 'https://…')}
      </div>
      <div class="actions">
        <button type="submit" class="bouton bouton-primaire">
          <Icone nom="valider" />
          Enregistrer
        </button>
        <button type="button" class="bouton bouton-secondaire" onClick={() => onFini(null)}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/** Nos adresses : là où l’on aime aller chercher à manger quand rien n’est prévu. */
export function Adresses({ onFermer }: { onFermer: () => void }) {
  const [edition, setEdition] = useState<Adresse | null>(null);
  const liste = adresses.value;
  return (
    <Dialogue
      id="titre-adresses"
      surtitre="Plan B"
      titre={edition ? (edition.id ? 'Modifier l’adresse' : 'Nouvelle adresse') : 'Nos adresses'}
      onFermer={onFermer}
      etroit
    >
      {edition ? (
        <FormulaireAdresse
          depart={edition}
          onFini={(a) => {
            setEdition(null);
            if (a) annoncer(`Adresse enregistrée : ${a.nom}.`);
          }}
        />
      ) : (
        <>
          {liste.length === 0 && <p class="aide">Aucune adresse pour l’instant.</p>}
          <ul class="adresses">
            {liste.map((a) => (
              <li key={a.id}>
                <div class="adresse-texte">
                  <strong>{a.nom}</strong>
                  <span>{[a.type, a.adresse, a.telephone].filter(Boolean).join(' · ') || 'À compléter'}</span>
                </div>
                <div class="actions">
                  <button
                    type="button"
                    class="bouton bouton-primaire bouton-petit"
                    aria-label={`Ce soir, on va chez ${a.nom}`}
                    onClick={() =>
                      void choisirPourCeSoir({ recetteId: null, adresseId: a.id }).then(() => {
                        annoncer(`Ce soir : ${a.nom}.`);
                        onFermer();
                      })
                    }
                  >
                    <Icone nom="valider" />
                    Ce soir
                  </button>
                  <LiensAdresse a={a} />
                  <button
                    type="button"
                    class="bouton bouton-texte bouton-petit"
                    aria-label={`Modifier ${a.nom}`}
                    onClick={() => setEdition(a)}
                  >
                    <Icone nom="crayon" />
                    Modifier
                  </button>
                  <button
                    type="button"
                    class="bouton bouton-texte bouton-petit"
                    aria-label={`Supprimer ${a.nom}`}
                    onClick={() => {
                      if (confirm(`Supprimer l’adresse « ${a.nom} » ?`))
                        void oublierAdresse(a.id).then(() => annoncer(`Adresse supprimée : ${a.nom}.`));
                    }}
                  >
                    <Icone nom="poubelle" />
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" class="ajout" onClick={() => setEdition({ ...VIDE })}>
            <Icone nom="plus" />
            Ajouter une adresse
          </button>
        </>
      )}
    </Dialogue>
  );
}
