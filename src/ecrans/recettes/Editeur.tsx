import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { annoncer } from '../../app/annonces';
import { rafraichir, recettes } from '../../app/bibliotheque-etat';
import { Icone } from '../../app/icones';
import { ancreFiche } from '../../app/routage';
import { RAYONS, type Rayon } from '../../domaine/dictionnaire';
import { analyserIngredient } from '../../domaine/ingredients';
import { ORIGINES, type Etape, type Recette, type TypeOrigine } from '../../domaine/modele';
import { structurer } from '../../domaine/structuration';
import { nouvelIdentifiant, obtenirBase } from '../../donnees/base';
import { reduirePhoto } from '../../donnees/photos';
import { enregistrerRecette, supprimerPhotos } from '../../donnees/recettes';
import { fermerEditeur } from './etat-editeur';
import { PhotoRecette } from './PhotoRecette';
import { type Brouillon, depuisRecette, empreinte, lignes, versRecette } from './brouillon';
import { EtapeEditable } from './EtapeEditable';

export function Editeur({ recetteId, modele }: { recetteId: string | null; modele: Recette | null }) {
  const existante = recetteId ? recettes.value.find((r) => r.id === recetteId) : undefined;
  const depart = existante ?? modele ?? undefined;
  const [b, setB] = useState<Brouillon>(() => depuisRecette(depart));
  const initiale = useMemo(() => empreinte(depuisRecette(depart)), [depart]);
  const [erreur, setErreur] = useState('');
  const [resumeProposition, setResumeProposition] = useState('');
  const dialogue = useRef<HTMLDialogElement>(null);
  const champNom = useRef<HTMLInputElement>(null);
  const titreEtapes = useRef<HTMLHeadingElement>(null);
  const modifie = empreinte(b) !== initiale;

  useEffect(() => {
    dialogue.current?.showModal();
    champNom.current?.focus();
  }, []);

  const maj = (partiel: Partial<Brouillon>) => setB((avant) => ({ ...avant, ...partiel }));
  const majEtape = (index: number, etape: Etape) =>
    setB((avant) => ({ ...avant, etapes: avant.etapes.map((e, i) => (i === index ? etape : e)) }));

  function demanderFermeture() {
    if (modifie && !confirm('Abandonner les modifications de cette recette ?')) return;
    dialogue.current?.close();
    fermerEditeur();
  }

  function proposer() {
    if (b.texteOriginal.trim() === '') {
      setErreur('Écrivez d’abord la recette dans le texte libre.');
      return;
    }
    if (b.etapes.length > 0 && !confirm('Remplacer les étapes actuelles par celles proposées ?')) return;
    const { etapes, ingredients } = structurer(b.texteOriginal);
    setErreur('');
    maj({
      etapes,
      ingredients: b.ingredients.trim() ? b.ingredients : ingredients.map((i) => i.texte).join('\n'),
    });
    const devinees = etapes.filter((e) => e.devinee).length;
    setResumeProposition(
      `${etapes.length} étape${etapes.length > 1 ? 's' : ''} proposée${etapes.length > 1 ? 's' : ''}, ${devinees} durée${devinees > 1 ? 's' : ''} devinée${devinees > 1 ? 's' : ''} à vérifier, ${ingredients.length} ingrédient${ingredients.length > 1 ? 's' : ''} reconnu${ingredients.length > 1 ? 's' : ''}.`,
    );
    queueMicrotask(() => titreEtapes.current?.focus());
  }

  async function ajouterPhoto(e: Event) {
    const champ = e.currentTarget as HTMLInputElement;
    const fichier = champ.files?.[0];
    champ.value = '';
    if (!fichier) return;
    try {
      const blob = await reduirePhoto(fichier);
      setB((avant) => ({
        ...avant,
        nouvelles: [...avant.nouvelles, { id: nouvelIdentifiant('photo'), blob }],
      }));
    } catch {
      setErreur('Cette image n’a pas pu être lue.');
    }
  }

  async function enregistrer(e: Event) {
    e.preventDefault();
    if (b.nom.trim() === '') {
      setErreur('Donnez un nom à la recette.');
      champNom.current?.focus();
      return;
    }
    const base = obtenirBase();
    await base.photos.bulkAdd(b.nouvelles.map((p) => ({ id: p.id, blob: p.blob })));
    await supprimerPhotos(
      base,
      (existante?.photos ?? []).filter((id) => !b.photos.includes(id)),
    );
    const recette = await enregistrerRecette(base, versRecette(b, existante, depart));
    await rafraichir();
    dialogue.current?.close();
    fermerEditeur();
    location.hash = ancreFiche(recette.id);
    annoncer(`« ${recette.nom} » enregistrée.`);
  }

  const apercu = lignes(b.ingredients).map((ligne) => {
    const connu = depart?.ingredients.find((i) => i.texte === ligne);
    return { ligne, ingredient: connu ?? analyserIngredient(ligne) };
  });
  const origines = (Object.keys(ORIGINES) as TypeOrigine[]).filter(
    (o) => o !== 'depart' || b.origine === 'depart',
  );

  return (
    <dialog
      ref={dialogue}
      class="editeur"
      aria-labelledby="titre-editeur"
      onCancel={(e) => {
        e.preventDefault();
        demanderFermeture();
      }}
    >
      <form class="editeur-forme" onSubmit={enregistrer} noValidate>
        <div class="editeur-entete">
          <div>
            <p class="surtitre">{existante ? 'Modifier' : 'Nouvelle recette'}</p>
            <h2 id="titre-editeur">{existante ? existante.nom : 'Une recette à vous'}</h2>
          </div>
          <button
            type="button"
            class="bouton bouton-secondaire bouton-icone"
            aria-label="Fermer"
            onClick={demanderFermeture}
          >
            <Icone nom="croix" />
          </button>
        </div>

        <div class="editeur-corps">
          {erreur && (
            <p class="bandeau bandeau-alerte" role="alert">
              {erreur}
            </p>
          )}
          <label class="champ">
            <span>Nom</span>
            <input
              ref={champNom}
              type="text"
              required
              value={b.nom}
              onInput={(e) => maj({ nom: e.currentTarget.value })}
            />
          </label>
          <fieldset class="champ">
            <legend>D’où vient-elle ?</legend>
            <div class="choix">
              {origines.map((o) => (
                <label key={o}>
                  <input
                    type="radio"
                    name="origine"
                    value={o}
                    checked={b.origine === o}
                    onChange={() => maj({ origine: o })}
                  />
                  <span>{ORIGINES[o]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div class="champs-ligne">
            {(b.origine === 'famille' || b.origine === 'maison') && (
              <label class="champ">
                <span>De qui ?</span>
                <input
                  type="text"
                  value={b.de}
                  placeholder="Maman, Mamie Jeanne, nous…"
                  onInput={(e) => maj({ de: e.currentTarget.value })}
                />
              </label>
            )}
            <label class="champ champ-court">
              <span>Portions</span>
              <input
                type="number"
                min={1}
                max={24}
                inputMode="numeric"
                value={b.portions}
                onInput={(e) => maj({ portions: Number(e.currentTarget.value) })}
              />
            </label>
          </div>

          <label class="champ">
            <span>La recette, telle qu’on la raconte</span>
            <span class="aide" id="aide-texte">
              Écrivez comme d’habitude. Ce texte est gardé tel quel ; Fournée en propose des étapes, que vous
              vérifiez.
            </span>
            <textarea
              rows={6}
              aria-describedby="aide-texte"
              value={b.texteOriginal}
              onInput={(e) => maj({ texteOriginal: e.currentTarget.value })}
            />
          </label>
          <div class="actions">
            <button type="button" class="bouton bouton-secondaire" onClick={proposer}>
              <Icone nom="etincelles" />
              Proposer les étapes
            </button>
            <label class="bouton bouton-secondaire bouton-fichier">
              <Icone nom="image" />
              Ajouter une photo de la fiche
              <input type="file" accept="image/*" class="visuellement-cache" onChange={ajouterPhoto} />
            </label>
          </div>
          {(b.photos.length > 0 || b.nouvelles.length > 0) && (
            <ul class="photos-editeur">
              {b.photos.map((id, i) => (
                <li key={id}>
                  <PhotoRecette id={id} alt={`Photo ${i + 1} de la fiche`} />
                  <button
                    type="button"
                    class="bouton bouton-texte bouton-petit"
                    onClick={() => maj({ photos: b.photos.filter((p) => p !== id) })}
                  >
                    Retirer la photo {i + 1}
                  </button>
                </li>
              ))}
              {b.nouvelles.map((p, i) => (
                <li key={p.id}>
                  <PhotoRecette blob={p.blob} alt={`Nouvelle photo ${i + 1} de la fiche`} />
                  <button
                    type="button"
                    class="bouton bouton-texte bouton-petit"
                    onClick={() => maj({ nouvelles: b.nouvelles.filter((x) => x.id !== p.id) })}
                  >
                    Retirer la nouvelle photo {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label class="champ">
            <span>Ingrédients, un par ligne</span>
            <textarea
              rows={6}
              value={b.ingredients}
              onInput={(e) => maj({ ingredients: e.currentTarget.value })}
            />
          </label>
          {apercu.length > 0 && (
            <ul class="apercu-ingredients" aria-label="Ingrédients reconnus">
              {apercu.map(({ ligne, ingredient }, i) => (
                <li key={`${i}-${ligne}`}>
                  <span>{ingredient.recetteId ? `${ligne} (sous-recette)` : ligne}</span>
                  <select
                    aria-label={`Rayon de « ${ligne} »`}
                    value={b.rayons[ligne] ?? ingredient.rayon}
                    onChange={(e) =>
                      maj({ rayons: { ...b.rayons, [ligne]: e.currentTarget.value as Rayon } })
                    }
                  >
                    {Object.entries(RAYONS).map(([valeur, nom]) => (
                      <option key={valeur} value={valeur}>
                        {nom}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}

          <section class="etapes-editeur" aria-labelledby="titre-etapes-editeur">
            <h3 id="titre-etapes-editeur" ref={titreEtapes} tabIndex={-1}>
              Étapes
            </h3>
            {resumeProposition && (
              <p class="aide" role="status">
                {resumeProposition}
              </p>
            )}
            {b.etapes.map((etape, i) => (
              <EtapeEditable
                key={etape.id}
                etape={etape}
                rang={i + 1}
                precedentes={b.etapes.slice(0, i)}
                changer={(e) => majEtape(i, e)}
                retirer={() =>
                  setB((avant) => ({
                    ...avant,
                    etapes: avant.etapes
                      .filter((e) => e.id !== etape.id)
                      .map((e) => ({ ...e, apres: e.apres.filter((d) => d !== etape.id) })),
                  }))
                }
              />
            ))}
            <button
              type="button"
              class="bouton bouton-secondaire"
              onClick={() =>
                maj({
                  etapes: [
                    ...b.etapes,
                    {
                      id: nouvelIdentifiant('e'),
                      texte: '',
                      poste: 'plan',
                      dureeMin: 5,
                      active: true,
                      apres: b.etapes.length ? [b.etapes[b.etapes.length - 1]?.id ?? ''] : [],
                      facultative: false,
                      anticiper: null,
                      devinee: false,
                      sousRecetteId: null,
                    },
                  ],
                })
              }
            >
              <Icone nom="plus" />
              Ajouter une étape
            </button>
          </section>

          <fieldset class="champ">
            <legend>Conservation</legend>
            <div class="champs-ligne">
              <label class="champ champ-court">
                <span>Jours au frigo</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={b.frigoJours}
                  onInput={(e) => maj({ frigoJours: Number(e.currentTarget.value) })}
                />
              </label>
              {b.congelable && (
                <label class="champ champ-court">
                  <span>Mois au congélateur</span>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={b.congelateurMois}
                    onInput={(e) => maj({ congelateurMois: Number(e.currentTarget.value) })}
                  />
                </label>
              )}
            </div>
            <div class="etape-cases">
              <label class="case">
                <input
                  type="checkbox"
                  checked={b.congelable}
                  onChange={(e) => maj({ congelable: e.currentTarget.checked })}
                />
                Se congèle
              </label>
              <label class="case">
                <input
                  type="checkbox"
                  checked={b.vegetarien}
                  onChange={(e) => maj({ vegetarien: e.currentTarget.checked })}
                />
                Végétarien
              </label>
              <label class="case">
                <input
                  type="checkbox"
                  checked={b.soir}
                  onChange={(ev) => maj({ soir: ev.currentTarget.checked })}
                />
                Recette du soir (à cuisiner le jour même)
              </label>
            </div>
          </fieldset>

          {(b.origine === 'famille' || b.origine === 'maison') && (
            <label class="champ">
              <span>Son petit mot (facultatif)</span>
              <input type="text" value={b.mot} onInput={(e) => maj({ mot: e.currentTarget.value })} />
            </label>
          )}
          <label class="champ">
            <span>Note de préparation ou de conservation (facultatif)</span>
            <input type="text" value={b.note} onInput={(e) => maj({ note: e.currentTarget.value })} />
          </label>
        </div>

        <div class="editeur-pied">
          <button type="button" class="bouton bouton-secondaire" onClick={demanderFermeture}>
            Annuler
          </button>
          <button type="submit" class="bouton bouton-primaire">
            <Icone nom="plus" />
            Enregistrer la recette
          </button>
        </div>
      </form>
    </dialog>
  );
}
