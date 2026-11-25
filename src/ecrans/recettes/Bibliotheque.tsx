import { useRef, useState } from 'preact/hooks';
import { annoncer } from '../../app/annonces';
import { chargee, manquantes, persistant, rafraichir, recettes } from '../../app/bibliotheque-etat';
import { Icone } from '../../app/icones';
import { ancreFiche } from '../../app/routage';
import { FILTRES, filtrerRecettes, type Filtre } from '../../domaine/bibliotheque';
import { obtenirBase } from '../../donnees/base';
import { exporter, importer } from '../../donnees/echange';
import { installerRecettesDeDepart } from '../../donnees/recettes';
import { Etiquettes, resume, teinte } from './commun';
import { ouvrirEditeur } from './etat-editeur';
import { importWeb } from './ImportWeb';

async function telechargerExport(): Promise<void> {
  const contenu = await exporter(obtenirBase());
  const nom = `fournee-recettes-${contenu.exporteLe.slice(0, 10)}.json`;
  const url = URL.createObjectURL(new Blob([JSON.stringify(contenu, null, 2)], { type: 'application/json' }));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  lien.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  annoncer(`Export prêt : ${nom}`);
}

const CLE_AVERTISSEMENT = 'fournee:avertissement-stockage-vu';
const avertissementDejaVu = () => {
  try {
    return localStorage.getItem(CLE_AVERTISSEMENT) === '1';
  } catch {
    return false;
  }
};

export function Bibliotheque({ message }: { message?: string | undefined }) {
  const [avertissementVu, setAvertissementVu] = useState(avertissementDejaVu);
  const [texte, setTexte] = useState('');
  const [filtres, setFiltres] = useState<Filtre[]>([]);
  const [erreursImport, setErreursImport] = useState<string[]>([]);
  const fichier = useRef<HTMLInputElement>(null);
  const liste = filtrerRecettes(recettes.value, texte, filtres);
  const total = recettes.value.length;

  const basculer = (f: Filtre) => setFiltres((l) => (l.includes(f) ? l.filter((x) => x !== f) : [...l, f]));

  async function lireFichier(e: Event) {
    const champ = e.currentTarget as HTMLInputElement;
    const choisi = champ.files?.[0];
    champ.value = '';
    if (!choisi) return;
    let donnees: unknown;
    try {
      donnees = JSON.parse(await choisi.text());
    } catch {
      setErreursImport(['Ce fichier n’est pas un fichier JSON lisible.']);
      return;
    }
    const resultat = await importer(obtenirBase(), donnees);
    if (!resultat.ok) {
      setErreursImport(resultat.erreurs);
      return;
    }
    setErreursImport([]);
    await rafraichir();
    const ignorees = resultat.ignorees.length ? `, ${resultat.ignorees.length} déjà présentes ignorées` : '';
    annoncer(
      `${resultat.ajoutees} recette${resultat.ajoutees > 1 ? 's' : ''} importée${resultat.ajoutees > 1 ? 's' : ''}${ignorees}.`,
    );
  }

  return (
    <section class="vue" aria-labelledby="titre-recettes">
      <div class="entete">
        <div>
          <p class="surtitre">Bibliothèque</p>
          <h1 id="titre-recettes" tabIndex={-1}>
            Recettes
          </h1>
          <p class="sous-titre">
            {chargee.value ? `${total} recette${total > 1 ? 's' : ''}` : 'Chargement'} · des étapes
            structurées pour orchestrer la session
          </p>
        </div>
        <div class="actions">
          <button type="button" class="bouton bouton-secondaire" onClick={() => fichier.current?.click()}>
            <Icone nom="importer" />
            Importer
          </button>
          <input
            ref={fichier}
            type="file"
            accept=".json,application/json"
            class="visuellement-cache"
            tabIndex={-1}
            aria-hidden="true"
            onChange={lireFichier}
          />
          <button type="button" class="bouton bouton-secondaire" onClick={telechargerExport}>
            <Icone nom="exporter" />
            Exporter
          </button>
          <button
            type="button"
            class="bouton bouton-secondaire"
            onClick={() => (importWeb.value = { texte: '', adresse: '' })}
          >
            <Icone nom="livre" />
            Depuis une page web
          </button>
          <button type="button" class="bouton bouton-primaire" onClick={() => ouvrirEditeur(null)}>
            <Icone nom="plus" />
            Nouvelle recette
          </button>
        </div>
      </div>

      {message && <p class="bandeau bandeau-info">{message}</p>}
      {erreursImport.length > 0 && (
        <div class="bandeau bandeau-alerte" role="alert">
          <p>
            <strong>Import refusé, rien n’a été modifié.</strong>
          </p>
          <ul>
            {erreursImport.slice(0, 5).map((e) => (
              <li key={e}>{e}</li>
            ))}
            {erreursImport.length > 5 && <li>Et {erreursImport.length - 5} autres erreurs.</li>}
          </ul>
        </div>
      )}
      {persistant.value === false && !avertissementVu && (
        <div class="bandeau bandeau-info bandeau-fermable">
          <p>
            Vos recettes restent sur cet appareil, mais le navigateur peut les effacer (sur iPhone, après 7
            jours sans visite). Installez Fournée sur l’écran d’accueil et exportez de temps en temps.
          </p>
          <button
            type="button"
            class="bouton bouton-secondaire bouton-petit"
            onClick={() => {
              setAvertissementVu(true);
              try {
                localStorage.setItem(CLE_AVERTISSEMENT, '1');
              } catch {
                // stockage bloqué : l’avertissement reviendra à la prochaine visite
              }
            }}
          >
            Compris
          </button>
        </div>
      )}

      <div class="outils-recettes">
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
        <div class="puces-filtre" role="group" aria-label="Filtres">
          {FILTRES.map((f) => (
            <button
              key={f.id}
              type="button"
              class="puce-filtre"
              aria-pressed={filtres.includes(f.id) ? 'true' : 'false'}
              onClick={() => basculer(f.id)}
            >
              {f.nom}
            </button>
          ))}
        </div>
      </div>

      <p class="visuellement-cache" aria-live="polite">
        {liste.length} recette{liste.length > 1 ? 's' : ''} affichée{liste.length > 1 ? 's' : ''}
      </p>
      {liste.length > 0 ? (
        <ul class="cartes-recettes">
          {liste.map((r) => (
            <li key={r.id}>
              <a class={`carte-recette teinte-${teinte(r.id)}`} href={ancreFiche(r.id)}>
                <span class="carte-recette-visuel">
                  <svg class="icone" aria-hidden="true">
                    <use href={`#i-${r.origine.type === 'famille' ? 'coeur' : 'bol'}`} />
                  </svg>
                </span>
                <span class="carte-recette-corps">
                  <span class="carte-recette-titre">{r.nom}</span>
                  {r.sousTitre && <span class="carte-recette-sous-titre">{r.sousTitre}</span>}
                  <span class="meta-recette">{resume(r)}</span>
                  <Etiquettes recette={r} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        chargee.value && <p class="vide">Aucune recette ne correspond à cette recherche.</p>
      )}

      {manquantes.value > 0 && (
        <p class="reinstaller">
          <button
            type="button"
            class="bouton bouton-secondaire"
            onClick={async () => {
              const n = await installerRecettesDeDepart(obtenirBase(), { manquantesSeulement: true });
              await rafraichir();
              annoncer(`${n} recette${n > 1 ? 's' : ''} de départ réinstallée${n > 1 ? 's' : ''}.`);
            }}
          >
            Réinstaller les recettes de départ manquantes ({manquantes.value})
          </button>
        </p>
      )}
    </section>
  );
}
