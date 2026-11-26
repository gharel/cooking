import { useRef, useState } from 'preact/hooks';
import { annoncer } from '../../app/annonces';
import { rafraichir, recettes } from '../../app/bibliotheque-etat';
import { Dialogue } from '../../app/Dialogue';
import { modifierFournee, reglages } from '../../app/fournee-etat';
import { Icone } from '../../app/icones';
import { ancreFiche } from '../../app/routage';
import { derniereSession } from '../../app/historique-etat';
import { rafraichirStock, restes } from '../../app/stock-etat';
import { aujourdhui } from '../../domaine/dates';
import { ajouterPlat } from '../../domaine/fournee';
import { CATALOGUE, idees, miniSession, recetteDepuisIdee, type Idee } from '../../domaine/idees';
import { analyserIngredient } from '../../domaine/ingredients';
import { restesProbables } from '../../domaine/stock';
import { nouvelIdentifiant, obtenirBase } from '../../donnees/base';
import { enregistrerRecette } from '../../donnees/recettes';
import { Compteur, ouvrirChoixPlat } from '../semaine/ChoixPlat';

export function DialogueMiniSession({ paire, fermer }: { paire: [Idee, Idee]; fermer: () => void }) {
  const [portions, setPortions] = useState(4);
  return (
    <Dialogue
      id="titre-mini-session"
      surtitre="Mini-session anti-gaspi"
      titre={`${paire[0].nom} + ${paire[1].nom}`}
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
              const ids: string[] = [];
              for (const i of paire)
                ids.push(i.source === 'recette' ? i.id : ((await ajouterIdee(i.id)) ?? ''));
              await modifierFournee((f) =>
                ids.filter(Boolean).reduce((x, id) => ajouterPlat(x, id, portions), f),
              );
              fermer();
              location.hash = '#session';
            }}
          >
            Préparer la session
          </button>
        </>
      }
    >
      <p class="aide">Les deux plats rejoignent la fournée ; la session les mène de front.</p>
      <div class="choix-portions">
        <span>Portions de chaque plat</span>
        <Compteur valeur={portions} libelle="Portions de chaque plat" changer={setPortions} />
      </div>
    </Dialogue>
  );
}

async function ajouterIdee(ideeId: string): Promise<string | null> {
  const idee = CATALOGUE.find((c) => c.id === ideeId);
  if (!idee) return null;
  const recette = await enregistrerRecette(
    obtenirBase(),
    recetteDepuisIdee(idee, nouvelIdentifiant('recette'), new Date().toISOString()),
  );
  await rafraichir();
  return recette.id;
}

export function CeQuilReste() {
  const [texte, setTexte] = useState('');
  const [mini, setMini] = useState<[Idee, Idee] | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const liste = restes.value;
  const { placard } = reglages.value;
  const proposees = idees(liste, recettes.value, placard).slice(0, 6);
  const paire = miniSession(idees(liste, recettes.value, placard));
  const derniere = derniereSession.value;
  const connus = new Set(liste.map((r) => r.cle));
  const probables = derniere
    ? restesProbables(derniere.plats, recettes.value, placard).filter((r) => !connus.has(r.cle))
    : [];

  async function ajouter(lignes: string[], vite = false) {
    const base = obtenirBase();
    await base.restes.bulkAdd(
      lignes.map((nom) => {
        const i = analyserIngredient(nom);
        return {
          id: nouvelIdentifiant('reste'),
          nom,
          cle: i.cle,
          quantite: i.quantite,
          unite: i.unite,
          vite,
          ajouteLe: aujourdhui(),
        };
      }),
    );
    await rafraichirStock();
  }

  return (
    <div class="grille-reste">
      <section class="carte" aria-labelledby="titre-ingredients-restants">
        <div class="carte-entete">
          <h2 id="titre-ingredients-restants">Dans le frigo</h2>
          <span class="pastille">
            {liste.length} ingrédient{liste.length > 1 ? 's' : ''}
          </span>
        </div>
        <p class="aide">Touchez un ingrédient pour le marquer « à finir vite », la croix pour le retirer.</p>
        <ul class="restes">
          {liste.map((r) => (
            <li key={r.id} class={`reste${r.vite ? ' vite' : ''}`}>
              <button
                type="button"
                class="reste-nom"
                aria-pressed={r.vite ? 'true' : 'false'}
                title="À finir vite : touchez pour changer"
                onClick={async () => {
                  await obtenirBase().restes.update(r.id, { vite: !r.vite });
                  await rafraichirStock();
                }}
              >
                {r.vite && <Icone nom="horloge" />}
                {r.nom}
                {r.vite && <span class="visuellement-cache">, à finir vite</span>}
              </button>
              <button
                type="button"
                class="reste-retirer"
                aria-label={`Retirer ${r.nom}`}
                onClick={async () => {
                  await obtenirBase().restes.delete(r.id);
                  await rafraichirStock();
                  champ.current?.focus();
                }}
              >
                <Icone nom="croix" />
              </button>
            </li>
          ))}
        </ul>
        <form
          class="ajout-reste"
          onSubmit={async (e) => {
            e.preventDefault();
            const lignes = texte
              .split(/[,;\n]/)
              .map((l) => l.trim())
              .filter(Boolean);
            if (lignes.length === 0) return;
            await ajouter(lignes);
            setTexte('');
          }}
        >
          <label for="champ-reste" class="visuellement-cache">
            Ajouter un ingrédient
          </label>
          <input
            ref={champ}
            id="champ-reste"
            type="text"
            autocomplete="off"
            placeholder="½ courgette, 3 œufs, un reste de riz…"
            value={texte}
            onInput={(e) => setTexte(e.currentTarget.value)}
          />
          <button type="submit" class="bouton bouton-secondaire">
            <Icone nom="plus" />
            Ajouter
          </button>
        </form>
        {probables.length > 0 && (
          <div class="restes-session">
            <p>
              D’après les courses de la dernière session, il devrait rester :{' '}
              {probables.map((r) => r.nom).join(', ')}.
            </p>
            <button
              type="button"
              class="bouton bouton-texte bouton-petit"
              onClick={() =>
                void ajouter(
                  probables.map((r) => r.nom),
                  true,
                )
              }
            >
              <Icone nom="plus" />
              Ajouter
            </button>
          </div>
        )}
        <p class="note">Les basiques du placard (huile, sel, poivre, épices) sont supposés présents.</p>
      </section>

      <section class="carte" aria-labelledby="titre-idees">
        <div class="carte-entete">
          <h2 id="titre-idees">Idées pour tout finir</h2>
          <span class="pastille">
            {proposees.length} idée{proposees.length > 1 ? 's' : ''}
          </span>
        </div>
        {paire && (
          <div class="mini-session">
            <p class="etiquette">
              <Icone nom="etincelles" />
              Mini-session anti-gaspi
            </p>
            <strong>
              {paire[0].nom} + {paire[1].nom}
            </strong>
            <span>Rien à acheter ; les deux plats se préparent ensemble.</span>
            <div>
              <button
                type="button"
                class="bouton bouton-primaire bouton-petit"
                onClick={() => setMini(paire)}
              >
                Cuisiner les deux
              </button>
            </div>
          </div>
        )}
        {proposees.length === 0 ? (
          <p class="vide">Ajoutez au moins deux ingrédients pour voir des idées.</p>
        ) : (
          <ul class="idees" aria-live="polite">
            {proposees.map((i) => (
              <li key={i.id} class="idee">
                <div class="idee-texte">
                  <strong>{i.nom}</strong>
                  <span>
                    {i.duree ? `${i.duree} min · ` : ''}utilise {i.utilises.length} ingrédient
                    {i.utilises.length > 1 ? 's' : ''}
                    {i.sauves.length ? `, dont ${i.sauves.length} à finir vite` : ''}
                    {i.source === 'catalogue' ? ' · idée' : ' · ma bibliothèque'}
                  </span>
                </div>
                {i.manque.length ? (
                  <span class="pastille pastille-bientot">Il manque : {i.manque.join(', ')}</span>
                ) : (
                  <span class="pastille pastille-ok">Rien à acheter</span>
                )}
                {i.source === 'recette' ? (
                  <button
                    type="button"
                    class="bouton bouton-secondaire bouton-petit"
                    onClick={() => ouvrirChoixPlat(i.id)}
                  >
                    Ajouter à la fournée
                  </button>
                ) : (
                  <button
                    type="button"
                    class="bouton bouton-secondaire bouton-petit"
                    onClick={async () => {
                      const id = await ajouterIdee(i.id);
                      if (id) {
                        location.hash = ancreFiche(id);
                        annoncer(`« ${i.nom} » ajoutée à vos recettes.`);
                      }
                    }}
                  >
                    Ajouter à mes recettes
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {mini && <DialogueMiniSession paire={mini} fermer={() => setMini(null)} />}
    </div>
  );
}
