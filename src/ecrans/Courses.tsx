import { useState } from 'preact/hooks';
import { annoncer } from '../app/annonces';
import { recettes } from '../app/bibliotheque-etat';
import { fournee, modifierFournee, modifierReglages, reglages } from '../app/fournee-etat';
import { Icone } from '../app/icones';
import { listeDeCourses, texteDesCourses, type LigneCourses } from '../domaine/courses';
import { platsDuSoir } from '../domaine/soir';
import { dateLongue } from '../domaine/dates';

async function partager(texte: string): Promise<void> {
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Courses Fournée', text: texte });
      return;
    }
    await navigator.clipboard.writeText(texte);
    annoncer('Liste copiée : collez-la où vous voulez.');
  } catch (e) {
    if ((e as Error).name !== 'AbortError') annoncer('Partage impossible sur cet appareil.');
  }
}

const CLE_MASQUER = 'fournee:masquer-coches';
const lireMasquer = () => {
  try {
    return localStorage.getItem(CLE_MASQUER) === '1';
  } catch {
    return false;
  }
};

function Article({ ligne, coche }: { ligne: LigneCourses; coche: boolean }) {
  return (
    <li class={`article${coche ? ' coche' : ''}`}>
      <label>
        <input
          type="checkbox"
          checked={coche}
          onChange={(e) => {
            const oui = e.currentTarget.checked;
            void modifierFournee((f) => ({
              ...f,
              coches: oui ? [...f.coches, ligne.cle] : f.coches.filter((c) => c !== ligne.cle),
            }));
          }}
        />
        <span class="article-texte">
          <span class="article-nom">{ligne.texte}</span>
          <span class="article-detail">{ligne.parts.map((p) => `${p.recette} ${p.texte}`).join(' · ')}</span>
        </span>
      </label>
      <button
        type="button"
        class="bouton bouton-texte bouton-petit"
        aria-label={`J’en ai déjà : ${ligne.texte}`}
        onClick={() => void modifierReglages((r) => ({ ...r, placard: [...r.placard, ligne.cle] }))}
      >
        J’en ai
      </button>
    </li>
  );
}

export function Courses() {
  const [masquer, setMasquer] = useState(lireMasquer);
  const f = fournee.value;
  // Plats de la session, plus les recettes du soir prévues au planning (une portion par personne et par repas).
  const duSoir = f ? platsDuSoir(f, recettes.value, reglages.value.personnes) : [];
  const aAcheter = f ? [...f.plats, ...duSoir] : [];
  const liste = listeDeCourses(aAcheter, recettes.value, reglages.value.placard);
  const coches = new Set(f?.coches ?? []);
  const lignes = liste.rayons.flatMap((r) => r.lignes);
  const faites = lignes.filter((l) => coches.has(l.cle)).length;

  return (
    <section class="vue" aria-labelledby="titre-courses">
      <div class="entete">
        <div>
          <p class="surtitre">Fournée</p>
          <h1 id="titre-courses" tabIndex={-1}>
            Courses
          </h1>
          <p class="sous-titre">
            {f
              ? `Pour la session du ${dateLongue(f.sessionLe)}${duSoir.length ? ' et les recettes du soir' : ''}`
              : 'Chargement'}{' '}
            · quantités regroupées, rangées par rayon
          </p>
        </div>
        {lignes.length > 0 && (
          <div class="actions">
            <button
              type="button"
              class="bouton bouton-secondaire"
              onClick={() => void partager(texteDesCourses(liste, [...coches]))}
            >
              <Icone nom="partage" />
              Partager
            </button>
          </div>
        )}
      </div>

      {lignes.length === 0 && liste.placard.length === 0 ? (
        <div class="carte a-venir">
          <span class="rond">
            <Icone nom="courses" />
          </span>
          <div class="a-venir-texte">
            <h2>Rien à acheter pour l’instant</h2>
            <p>
              Ajoutez les plats de la semaine : la liste se construit toute seule, une ligne par ingrédient.
            </p>
            <a class="bouton bouton-primaire" href="#semaine">
              <Icone nom="calendrier" />
              Choisir les plats
            </a>
          </div>
        </div>
      ) : (
        <>
          <div class="carte progression-courses">
            <p class="progression-texte">
              <span>
                <strong>
                  {faites} sur {lignes.length}
                </strong>{' '}
                articles dans le panier
              </span>
              <span>Disponible hors ligne</span>
            </p>
            <div class="jauge">
              <span style={{ width: `${lignes.length ? (faites / lignes.length) * 100 : 0}%` }} />
            </div>
            <label class="interrupteur">
              <input
                type="checkbox"
                checked={masquer}
                onChange={(e) => {
                  const oui = e.currentTarget.checked;
                  setMasquer(oui);
                  try {
                    localStorage.setItem(CLE_MASQUER, oui ? '1' : '0');
                  } catch {
                    // préférence non gardée
                  }
                }}
              />
              <span>Masquer les articles cochés</span>
            </label>
          </div>

          <div class={`rayons${masquer ? ' masquer' : ''}`}>
            {liste.rayons.map((r) => (
              <section key={r.rayon} class="carte rayon" aria-labelledby={`rayon-${r.rayon}`}>
                <h2 id={`rayon-${r.rayon}`}>
                  {r.nom} <span class="compte">{r.lignes.length}</span>
                </h2>
                <ul class="articles">
                  {r.lignes.map((l) => (
                    <Article key={l.cle} ligne={l} coche={coches.has(l.cle)} />
                  ))}
                </ul>
              </section>
            ))}
            {liste.placard.length > 0 && (
              <section class="carte rayon" aria-labelledby="rayon-placard">
                <h2 id="rayon-placard">
                  Au placard <span class="compte">{liste.placard.length}</span>
                </h2>
                <p class="aide">Les basiques supposés à la maison : vérifiez d’un coup d’œil.</p>
                <ul class="placard">
                  {liste.placard.map((l) => (
                    <li key={l.cle}>
                      <span>{l.texte}</span>
                      <button
                        type="button"
                        class="bouton bouton-texte bouton-petit"
                        aria-label={`À acheter : ${l.texte}`}
                        onClick={() =>
                          void modifierReglages((x) => ({
                            ...x,
                            placard: x.placard.filter((c) => c !== l.cle),
                          }))
                        }
                      >
                        À acheter
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </>
      )}
    </section>
  );
}
