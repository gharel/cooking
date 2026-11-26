import { useEffect, useRef, useState } from 'preact/hooks';
import { annoncer } from '../app/annonces';
import { rafraichir, recettes } from '../app/bibliotheque-etat';
import { Dialogue } from '../app/Dialogue';
import { fournee, modifierFournee, reglages } from '../app/fournee-etat';
import { Icone } from '../app/icones';
import { ancreFiche, type OngletFrigo } from '../app/routage';
import { derniereSession } from '../app/historique-etat';
import { plats, rafraichirStock, restes } from '../app/stock-etat';
import { ajouterJours, ajouterMois, aujourdhui, dateLongue, dateCourte } from '../domaine/dates';
import { ajouterPlat } from '../domaine/fournee';
import { CATALOGUE, idees, miniSession, recetteDepuisIdee, type Idee } from '../domaine/idees';
import { analyserIngredient } from '../domaine/ingredients';
import {
  alertesStock,
  congeler,
  decongeler,
  fraicheur,
  mangerPortion,
  rappelsDecongelation,
  restesProbables,
  type Lieu,
  type Plat,
} from '../domaine/stock';
import { nouvelIdentifiant, obtenirBase } from '../donnees/base';
import { enregistrerRecette } from '../donnees/recettes';
import { Compteur, ouvrirChoixPlat } from './semaine/ChoixPlat';

const ONGLETS = [
  { id: 'plats', nom: 'Plats préparés', icone: 'frigo' },
  { id: 'reste', nom: 'Ce qu’il reste', icone: 'bol' },
] as const;

async function remplacerPlats(retirer: string[], ajouter: Plat[]): Promise<void> {
  const base = obtenirBase();
  await base.transaction('rw', base.plats, async () => {
    await base.plats.bulkDelete(retirer);
    await base.plats.bulkPut(ajouter);
  });
  await rafraichirStock();
}

function libelleJours(p: Plat, jour: string): string {
  const f = fraicheur(p, jour);
  if (f.niveau === 'depasse') return 'Dépassé';
  if (f.niveau === 'aujourdhui') return 'Aujourd’hui';
  if (p.lieu === 'congelateur' && f.joursRestants > 60) return `${Math.round(f.joursRestants / 30)} mois`;
  return `${f.joursRestants} jour${f.joursRestants > 1 ? 's' : ''}`;
}

const PASTILLES = {
  depasse: 'pastille-alerte',
  aujourdhui: 'pastille-alerte',
  bientot: 'pastille-bientot',
  ok: 'pastille-ok',
};

function DialogueDecongeler({ plat, fermer }: { plat: Plat; fermer: () => void }) {
  const [n, setN] = useState(Math.min(plat.portions, reglages.value.personnes));
  return (
    <Dialogue
      id="titre-decongeler"
      surtitre="Décongeler"
      titre={plat.nom}
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
              const { reste, sorti } = decongeler(plat, n, aujourdhui(), () => nouvelIdentifiant('plat'));
              await remplacerPlats([plat.id], reste ? [reste, sorti] : [sorti]);
              fermer();
              annoncer(`${n} portion${n > 1 ? 's' : ''} au frigo, à manger d’ici demain.`);
            }}
          >
            Sortir du congélateur
          </button>
        </>
      }
    >
      <p class="aide">Au frigo, un plat décongelé se mange sous 24 h.</p>
      <div class="choix-portions">
        <span>Portions à sortir</span>
        <Compteur valeur={n} max={plat.portions} libelle="Portions à sortir" changer={setN} />
      </div>
    </Dialogue>
  );
}

function DialogueAjouterPlat({ fermer }: { fermer: () => void }) {
  const [nom, setNom] = useState('');
  const [portions, setPortions] = useState(2);
  const [lieu, setLieu] = useState<Lieu>('frigo');
  const [erreur, setErreur] = useState('');
  const recette = recettes.value.find((r) => r.nom.toLowerCase() === nom.trim().toLowerCase());
  const jour = aujourdhui();
  const limiteProposee =
    lieu === 'frigo'
      ? ajouterJours(jour, recette?.conservation.frigoJours ?? 3)
      : ajouterMois(jour, recette?.conservation.congelateurMois ?? 3);
  const [limite, setLimite] = useState<string | null>(null);
  return (
    <Dialogue
      id="titre-ajouter-plat"
      surtitre="Frigo"
      titre="Ajouter un plat"
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
              if (!nom.trim()) {
                setErreur('Donnez un nom au plat.');
                return;
              }
              await remplacerPlats(
                [],
                [
                  {
                    id: nouvelIdentifiant('plat'),
                    recetteId: recette?.id ?? null,
                    nom: recette?.nom ?? nom.trim(),
                    portions,
                    lieu,
                    prepareLe: jour,
                    limite: limite ?? limiteProposee,
                    fourneeId: null,
                  },
                ],
              );
              fermer();
              annoncer(`« ${nom.trim()} » ajouté ${lieu === 'frigo' ? 'au frigo' : 'au congélateur'}.`);
            }}
          >
            <Icone nom="plus" />
            Ajouter
          </button>
        </>
      }
    >
      {erreur && (
        <p class="bandeau bandeau-alerte" role="alert">
          {erreur}
        </p>
      )}
      <label class="champ">
        <span>Nom du plat</span>
        <input type="text" list="noms-recettes" value={nom} onInput={(e) => setNom(e.currentTarget.value)} />
        <datalist id="noms-recettes">
          {recettes.value.map((r) => (
            <option key={r.id} value={r.nom} />
          ))}
        </datalist>
      </label>
      <div class="choix-portions">
        <span>Portions</span>
        <Compteur valeur={portions} max={20} libelle="Portions du plat" changer={setPortions} />
      </div>
      <fieldset class="champ">
        <legend>Où ?</legend>
        <div class="choix">
          {(['frigo', 'congelateur'] as const).map((l) => (
            <label key={l}>
              <input type="radio" name="lieu" checked={lieu === l} onChange={() => setLieu(l)} />
              <span>{l === 'frigo' ? 'Frigo' : 'Congélateur'}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label class="champ champ-court">
        <span>À manger avant le</span>
        <input
          type="date"
          value={limite ?? limiteProposee}
          onChange={(e) => setLimite(e.currentTarget.value || null)}
        />
      </label>
    </Dialogue>
  );
}

function PlatsPrepares() {
  const [filtre, setFiltre] = useState<'tout' | Lieu>('tout');
  const [ajout, setAjout] = useState(false);
  const [aDecongeler, setADecongeler] = useState<Plat | null>(null);
  const jour = aujourdhui();
  const tous = [...plats.value].sort((a, b) => a.limite.localeCompare(b.limite));
  const visibles = tous.filter((p) => filtre === 'tout' || p.lieu === filtre);
  const alertes = alertesStock(tous, jour);
  const fournees = [fournee.value, derniereSession.value].filter((f) => f !== null);
  const rappels = rappelsDecongelation(fournees, tous, recettes.value, reglages.value.personnes, jour);
  const compter = (l: Lieu) => tous.filter((p) => p.lieu === l).length;

  async function manger(p: Plat) {
    const apres = mangerPortion(p);
    await remplacerPlats(apres ? [] : [p.id], apres ? [apres] : []);
    annoncer(
      apres
        ? `${p.nom} : ${apres.portions} portion${apres.portions > 1 ? 's' : ''} restante${apres.portions > 1 ? 's' : ''}.`
        : `${p.nom} : plus rien en stock.`,
      {
        libelle: 'Annuler',
        faire: () => remplacerPlats([], [p]),
      },
    );
  }

  return (
    <>
      {alertes.length > 0 && (
        <div class="bandeau bandeau-alerte" role="status">
          <ul>
            {alertes.map((a) => (
              <li key={a.platId}>{a.texte}</li>
            ))}
          </ul>
        </div>
      )}
      <div class="barre-outils">
        <div class="segments" role="group" aria-label="Filtrer par lieu">
          {(
            [
              ['tout', 'Tout', tous.length],
              ['frigo', 'Frigo', compter('frigo')],
              ['congelateur', 'Congélateur', compter('congelateur')],
            ] as const
          ).map(([v, nom, n]) => (
            <button
              key={v}
              type="button"
              aria-pressed={filtre === v ? 'true' : 'false'}
              onClick={() => setFiltre(v)}
            >
              {nom} <span>{n}</span>
            </button>
          ))}
        </div>
        <button type="button" class="bouton bouton-secondaire" onClick={() => setAjout(true)}>
          <Icone nom="plus" />
          Ajouter un plat
        </button>
      </div>

      <div class="grille-stock">
        {visibles.length === 0 ? (
          <p class="vide">
            {tous.length === 0
              ? 'Rien pour l’instant : les plats arrivent ici à la fin de chaque session.'
              : 'Rien à cet endroit.'}
          </p>
        ) : (
          <ul class="liste-stock">
            {visibles.map((p) => {
              const f = fraicheur(p, jour);
              const recette = p.recetteId ? recettes.value.find((r) => r.id === p.recetteId) : undefined;
              return (
                <li key={p.id} class="plat">
                  <div class="plat-entete">
                    <h2>{recette ? <a href={ancreFiche(recette.id)}>{p.nom}</a> : p.nom}</h2>
                    <span class={`pastille ${PASTILLES[f.niveau]}`}>{libelleJours(p, jour)}</span>
                  </div>
                  <p class="plat-meta">
                    <Icone nom={p.lieu === 'frigo' ? 'frigo' : 'flocon'} />
                    {p.lieu === 'frigo' ? 'Frigo' : 'Congélateur'} · {p.portions} portion
                    {p.portions > 1 ? 's' : ''} · préparé le {dateCourte(p.prepareLe)}
                  </p>
                  <div class={`fraicheur ${f.niveau}${p.lieu === 'congelateur' ? ' froid' : ''}`}>
                    <span style={{ width: `${Math.max(4, f.part * 100)}%` }} />
                  </div>
                  <p class="plat-limite">À manger avant le {dateLongue(p.limite)}</p>
                  <div class="plat-actions">
                    <button
                      type="button"
                      class="bouton bouton-secondaire bouton-petit"
                      onClick={() => void manger(p)}
                    >
                      Manger 1 portion
                    </button>
                    {p.lieu === 'frigo' && (!recette || recette.conservation.congelateurMois !== null) && (
                      <button
                        type="button"
                        class="bouton bouton-texte bouton-petit"
                        onClick={async () => {
                          await remplacerPlats(
                            [],
                            [congeler(p, recette?.conservation.congelateurMois ?? null, jour)],
                          );
                          annoncer(`${p.nom} au congélateur.`);
                        }}
                      >
                        Congeler
                      </button>
                    )}
                    {p.lieu === 'congelateur' && (
                      <button
                        type="button"
                        class="bouton bouton-texte bouton-petit"
                        onClick={() => setADecongeler(p)}
                      >
                        Décongeler
                      </button>
                    )}
                    <button
                      type="button"
                      class="bouton bouton-texte bouton-petit"
                      aria-label={`Retirer ${p.nom}`}
                      onClick={async () => {
                        await remplacerPlats([p.id], []);
                        annoncer(`${p.nom} retiré.`, {
                          libelle: 'Annuler',
                          faire: () => remplacerPlats([], [p]),
                        });
                      }}
                    >
                      Retirer
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <aside class="carte rappels" aria-labelledby="titre-rappels">
          <h2 id="titre-rappels">Rappels</h2>
          {rappels.length === 0 ? (
            <p class="aide">Aucun plat à sortir du congélateur pour les repas prévus.</p>
          ) : (
            <ul>
              {rappels.map((r) => (
                <li key={r.texte}>
                  <Icone nom="flocon" />
                  <span>{r.texte}</span>
                </li>
              ))}
            </ul>
          )}
          <p class="note">
            Durées par défaut prudentes : 3 jours au frigo, 3 mois au congélateur, 24 h après décongélation ;
            modifiables. Ces indications ne remplacent pas les recommandations sanitaires officielles.
          </p>
        </aside>
      </div>
      {ajout && <DialogueAjouterPlat fermer={() => setAjout(false)} />}
      {aDecongeler && <DialogueDecongeler plat={aDecongeler} fermer={() => setADecongeler(null)} />}
    </>
  );
}

function DialogueMiniSession({ paire, fermer }: { paire: [Idee, Idee]; fermer: () => void }) {
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

function CeQuilReste() {
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

export function Frigo({ onglet }: { onglet: OngletFrigo | undefined }) {
  const [actif, setActif] = useState<OngletFrigo>(onglet ?? 'plats');
  const boutons = useRef<Partial<Record<OngletFrigo, HTMLButtonElement | null>>>({});
  useEffect(() => {
    if (onglet) setActif(onglet);
  }, [onglet]);
  useEffect(() => {
    void rafraichirStock();
  }, []);
  const choisir = (id: OngletFrigo, focus = false) => {
    setActif(id);
    if (focus) boutons.current[id]?.focus();
  };
  return (
    <section class="vue" aria-labelledby="titre-frigo">
      <div class="entete">
        <div>
          <p class="surtitre">Frigo</p>
          <h1 id="titre-frigo" tabIndex={-1}>
            Frigo et congélateur
          </h1>
          <p class="sous-titre">
            {plats.value.length} plat{plats.value.length > 1 ? 's' : ''} préparé
            {plats.value.length > 1 ? 's' : ''} · {restes.value.length} ingrédient
            {restes.value.length > 1 ? 's' : ''} qui reste{restes.value.length > 1 ? 'nt' : ''}
          </p>
        </div>
      </div>
      <div class="onglets-vue" role="tablist" aria-label="Contenu du frigo">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            ref={(el) => {
              boutons.current[o.id] = el;
            }}
            type="button"
            role="tab"
            id={`onglet-${o.id}`}
            aria-selected={actif === o.id ? 'true' : 'false'}
            aria-controls={`panneau-${o.id}`}
            tabIndex={actif === o.id ? 0 : -1}
            onClick={() => choisir(o.id)}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
              e.preventDefault();
              choisir(actif === 'plats' ? 'reste' : 'plats', true);
            }}
          >
            <Icone nom={o.icone} />
            {o.nom}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panneau-plats" aria-labelledby="onglet-plats" hidden={actif !== 'plats'}>
        {actif === 'plats' && <PlatsPrepares />}
      </div>
      <div role="tabpanel" id="panneau-reste" aria-labelledby="onglet-reste" hidden={actif !== 'reste'}>
        {actif === 'reste' && <CeQuilReste />}
      </div>
    </section>
  );
}
