import { annoncer } from '../../app/annonces';
import { rafraichir, recettes } from '../../app/bibliotheque-etat';
import { Icone } from '../../app/icones';
import { ancreFiche } from '../../app/routage';
import { ORIGINES, POSTES, type Etape, type Recette } from '../../domaine/modele';
import { formaterDuree } from '../../domaine/texte';
import { obtenirBase } from '../../donnees/base';
import { exporterRecette } from '../../donnees/echange';
import { partagerFichier } from '../../app/partager';
import { slug } from '../../domaine/texte';
import { annulerSuppression, dupliquerRecette, supprimerRecette } from '../../donnees/recettes';
import { Etiquettes, resume, teinte } from './commun';
import { ouvrirChoixPlat } from '../semaine/ChoixPlat';
import { ouvrirEditeur } from './etat-editeur';
import { PhotoRecette } from './PhotoRecette';

function AttributsEtape({ etape, toutes }: { etape: Etape; toutes: Etape[] }) {
  const rang = (id: string) => toutes.findIndex((e) => e.id === id) + 1;
  const sousRecette = etape.sousRecetteId
    ? recettes.value.find((r) => r.id === etape.sousRecetteId)
    : undefined;
  return (
    <div class="attributs">
      <span class="attribut">{POSTES[etape.poste]}</span>
      <span class={`attribut ${etape.active ? 'actif' : 'passif'}`}>{etape.active ? 'Actif' : 'Passif'}</span>
      {sousRecette ? (
        <a class="attribut" href={ancreFiche(sousRecette.id)}>
          Voir la recette {sousRecette.nom}
        </a>
      ) : (
        <span class={`attribut${etape.devinee ? ' devinee' : ''}`}>
          {formaterDuree(etape.dureeMin)}
          {etape.devinee && ' (devinée)'}
        </span>
      )}
      {etape.apres.length > 0 && <span class="attribut">Après {etape.apres.map(rang).join(' et ')}</span>}
      {etape.facultative && <span class="attribut">Facultative</span>}
      {etape.anticiper === 'veille' && <span class="attribut bientot">La veille</span>}
    </div>
  );
}

export function Fiche({ recette: r }: { recette: Recette }) {
  async function supprimer() {
    if (!confirm(`Supprimer la recette « ${r.nom} » ?`)) return;
    const suppression = await supprimerRecette(obtenirBase(), r.id);
    await rafraichir();
    location.hash = '#recettes';
    if (suppression)
      annoncer(`« ${r.nom} » supprimée.`, {
        libelle: 'Annuler',
        faire: async () => {
          await annulerSuppression(obtenirBase(), suppression);
          await rafraichir();
          location.hash = ancreFiche(r.id);
        },
      });
  }

  async function partager() {
    const contenu = await exporterRecette(obtenirBase(), r.id);
    if (!contenu) return;
    await partagerFichier(`${slug(r.nom)}.fournee.json`, JSON.stringify(contenu, null, 2), r.nom);
  }

  async function dupliquer() {
    const copie = await dupliquerRecette(obtenirBase(), r.id);
    if (!copie) return;
    await rafraichir();
    location.hash = ancreFiche(copie.id);
    annoncer(`Copie créée : « ${copie.nom} ».`);
  }

  const famille = r.origine.type === 'famille' || r.origine.type === 'maison';
  return (
    <section class={`vue fiche teinte-${teinte(r.id)}`} aria-labelledby="titre-fiche">
      <a class="retour" href="#recettes">
        <Icone nom="retour" />
        Toutes les recettes
      </a>
      <div class="entete">
        <div>
          <p class="surtitre">{ORIGINES[r.origine.type]}</p>
          <h1 id="titre-fiche" tabIndex={-1}>
            {r.nom}
          </h1>
          <p class="sous-titre">{[r.sousTitre, resume(r)].filter(Boolean).join(' · ')}</p>
        </div>
        <div class="actions">
          <button type="button" class="bouton bouton-primaire" onClick={() => ouvrirChoixPlat(r.id)}>
            <Icone nom="plus" />
            Ajouter à la fournée
          </button>
          <button type="button" class="bouton bouton-secondaire" onClick={() => ouvrirEditeur(r.id)}>
            <Icone nom="crayon" />
            Modifier
          </button>
          <button type="button" class="bouton bouton-secondaire" onClick={() => void partager()}>
            <Icone nom="partage" />
            Partager
          </button>
          <button type="button" class="bouton bouton-secondaire" onClick={() => window.print()}>
            <Icone nom="livre" />
            Imprimer
          </button>
          <button type="button" class="bouton bouton-secondaire" onClick={dupliquer}>
            <Icone nom="copie" />
            Dupliquer
          </button>
          <button type="button" class="bouton bouton-secondaire" onClick={supprimer}>
            <Icone nom="poubelle" />
            Supprimer
          </button>
        </div>
      </div>

      <div class="grille-fiche">
        <div class="colonne-fiche">
          <div class="carte carte-infos">
            <Etiquettes recette={r} />
            <p class="conservation">
              <Icone nom="flocon" />
              Frigo {r.conservation.frigoJours} jours ·{' '}
              {r.conservation.congelateurMois === null
                ? 'ne se congèle pas'
                : `congélateur ${r.conservation.congelateurMois} mois`}
            </p>
            {r.note && <p class="note-recette">{r.note}</p>}
            {famille && (
              <div class="origine">
                <span class="rond">
                  <Icone nom={r.origine.type === 'famille' ? 'coeur' : 'maison'} />
                </span>
                <div>
                  <strong>
                    {r.origine.type === 'famille'
                      ? `Recette ${r.origine.de ? `de ${r.origine.de}` : 'de famille'}`
                      : 'Notre recette'}
                  </strong>
                  {r.texteOriginal && <span>Texte d’origine conservé</span>}
                </div>
              </div>
            )}
            {r.origine.mot && <blockquote class="mot">{r.origine.mot}</blockquote>}
            {r.origine.source && (
              <p class="source-recette">
                {/^https?:\/\//i.test(r.origine.source) ? (
                  <a href={r.origine.source} target="_blank" rel="noopener noreferrer">
                    Page d’origine
                  </a>
                ) : (
                  `Source : ${r.origine.source}`
                )}
              </p>
            )}
            {r.photos.map((id, i) => (
              <PhotoRecette key={id} id={id} alt={`Photo ${i + 1} de la fiche « ${r.nom} »`} />
            ))}
          </div>
          <section class="carte" aria-labelledby="titre-ingredients">
            <h2 id="titre-ingredients">Ingrédients</h2>
            <ul class="ingredients">
              {r.ingredients.map((i, n) => (
                <li key={`${n}-${i.texte}`}>
                  {i.recetteId ? <a href={ancreFiche(i.recetteId)}>{i.texte}</a> : i.texte}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div class="colonne-fiche">
          <section class="carte" aria-labelledby="titre-etapes">
            <h2 id="titre-etapes">Étapes</h2>
            {r.etapes.length === 0 ? (
              <p class="aide">
                Pas encore d’étapes structurées : « Modifier », puis « Proposer les étapes ».
              </p>
            ) : (
              <ol class="etapes-structurees">
                {r.etapes.map((e, n) => (
                  <li key={e.id}>
                    <span class="numero">{n + 1}</span>
                    <div>
                      <p>{e.texte}</p>
                      <AttributsEtape etape={e} toutes={r.etapes} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
          {r.texteOriginal && (
            <section class="carte" aria-labelledby="titre-texte-original">
              <h2 id="titre-texte-original">Texte d’origine</h2>
              <p class="texte-original" data-brut>
                {r.texteOriginal}
              </p>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
