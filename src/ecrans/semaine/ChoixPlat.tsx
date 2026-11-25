import { signal } from '@preact/signals';
import { useState } from 'preact/hooks';
import { annoncer } from '../../app/annonces';
import { recettes } from '../../app/bibliotheque-etat';
import { Dialogue } from '../../app/Dialogue';
import { fournee, modifierFournee } from '../../app/fournee-etat';
import { Icone } from '../../app/icones';
import { filtrerRecettes } from '../../domaine/bibliotheque';
import { ajouterPlat } from '../../domaine/fournee';
import { resume } from '../recettes/commun';

/** Choix d’un plat pour la fournée : la recette (si elle n’est pas déjà connue), puis les portions. */
export const choixPlat = signal<{ recetteId: string | null; retour: HTMLElement | null } | null>(null);

export function ouvrirChoixPlat(recetteId: string | null): void {
  choixPlat.value = { recetteId, retour: document.activeElement as HTMLElement | null };
}

function fermer(): void {
  const retour = choixPlat.value?.retour;
  choixPlat.value = null;
  queueMicrotask(() => retour?.isConnected && retour.focus());
}

export const PORTIONS_PAR_DEFAUT = 4;

export function Compteur({
  valeur,
  min = 1,
  max = 40,
  libelle,
  changer,
}: {
  valeur: number;
  min?: number;
  max?: number;
  libelle: string;
  changer: (v: number) => void;
}) {
  return (
    <div class="compteur" role="group" aria-label={libelle}>
      <button
        type="button"
        aria-label={`${libelle} : une de moins`}
        disabled={valeur <= min}
        onClick={() => changer(Math.max(min, valeur - 1))}
      >
        <svg class="icone" aria-hidden="true">
          <use href="#i-moins" />
        </svg>
      </button>
      <output aria-live="polite">{valeur}</output>
      <button
        type="button"
        aria-label={`${libelle} : une de plus`}
        disabled={valeur >= max}
        onClick={() => changer(Math.min(max, valeur + 1))}
      >
        <Icone nom="plus" />
      </button>
    </div>
  );
}

function Contenu({ recetteInitiale }: { recetteInitiale: string | null }) {
  const [recetteId, setRecetteId] = useState<string | null>(recetteInitiale);
  const deja = fournee.value?.plats.find((p) => p.recetteId === recetteId);
  const [portions, setPortions] = useState(deja?.portions ?? PORTIONS_PAR_DEFAUT);
  const [texte, setTexte] = useState('');
  const recette = recettes.value.find((r) => r.id === recetteId);

  if (!recette) {
    const liste = filtrerRecettes(recettes.value, texte, []);
    return (
      <Dialogue id="titre-choix-plat" surtitre="Fournée" titre="Ajouter un plat" onFermer={fermer}>
        <label class="recherche">
          <Icone nom="recherche" />
          <input
            type="search"
            value={texte}
            onInput={(e) => setTexte(e.currentTarget.value)}
            placeholder="Rechercher une recette"
            aria-label="Rechercher une recette"
          />
        </label>
        <ul class="liste-choix">
          {liste.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                class="choix-recette"
                onClick={() => {
                  setRecetteId(r.id);
                  setPortions(
                    fournee.value?.plats.find((p) => p.recetteId === r.id)?.portions ?? PORTIONS_PAR_DEFAUT,
                  );
                }}
              >
                <strong>{r.nom}</strong>
                <span>{resume(r)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Dialogue>
    );
  }

  return (
    <Dialogue
      id="titre-choix-plat"
      surtitre="Fournée"
      titre={recette.nom}
      etroit
      onFermer={fermer}
      pied={
        <>
          <button type="button" class="bouton bouton-secondaire" onClick={fermer}>
            Annuler
          </button>
          <button
            type="button"
            class="bouton bouton-primaire"
            onClick={async () => {
              await modifierFournee((f) => ajouterPlat(f, recette.id, portions));
              fermer();
              annoncer(`« ${recette.nom} » : ${portions} portions dans la fournée.`);
            }}
          >
            <Icone nom="plus" />
            {deja ? 'Mettre à jour' : 'Ajouter à la fournée'}
          </button>
        </>
      }
    >
      <p class="aide">
        Combien de portions cuisiner ? La recette est écrite pour {recette.portions} ; les quantités des
        courses suivront.
      </p>
      <div class="choix-portions">
        <span id="libelle-portions">Portions</span>
        <Compteur valeur={portions} libelle="Portions" changer={setPortions} />
      </div>
    </Dialogue>
  );
}

export function ChoixPlat() {
  const ouvert = choixPlat.value;
  return ouvert ? <Contenu key={ouvert.recetteId ?? 'liste'} recetteInitiale={ouvert.recetteId} /> : null;
}
