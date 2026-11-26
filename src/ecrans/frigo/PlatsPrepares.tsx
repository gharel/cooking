import { useState } from 'preact/hooks';
import { annoncer } from '../../app/annonces';
import { recettes } from '../../app/bibliotheque-etat';
import { Dialogue } from '../../app/Dialogue';
import { fournee, reglages } from '../../app/fournee-etat';
import { Icone } from '../../app/icones';
import { ancreFiche } from '../../app/routage';
import { derniereSession } from '../../app/historique-etat';
import { plats, rafraichirStock } from '../../app/stock-etat';
import { ajouterJours, ajouterMois, aujourdhui, dateLongue, dateCourte } from '../../domaine/dates';
import {
  alertesStock,
  congeler,
  decongeler,
  fraicheur,
  mangerPortion,
  rappelsDecongelation,
  type Lieu,
  type Plat,
} from '../../domaine/stock';
import { nouvelIdentifiant, obtenirBase } from '../../donnees/base';
import { Compteur } from '../semaine/ChoixPlat';

async function remplacerPlats(retirer: string[], ajouter: Plat[]): Promise<void> {
  const base = obtenirBase();
  await base.transaction('rw', base.plats, async () => {
    await base.plats.bulkDelete(retirer);
    await base.plats.bulkPut(ajouter);
  });
  await rafraichirStock();
}

export function libelleJours(p: Plat, jour: string): string {
  const f = fraicheur(p, jour);
  if (f.niveau === 'depasse') return 'Dépassé';
  if (f.niveau === 'aujourdhui') return 'Aujourd’hui';
  if (p.lieu === 'congelateur' && f.joursRestants > 60) return `${Math.round(f.joursRestants / 30)} mois`;
  return `${f.joursRestants} jour${f.joursRestants > 1 ? 's' : ''}`;
}

export const PASTILLES = {
  depasse: 'pastille-alerte',
  aujourdhui: 'pastille-alerte',
  bientot: 'pastille-bientot',
  ok: 'pastille-ok',
};

export function DialogueDecongeler({ plat, fermer }: { plat: Plat; fermer: () => void }) {
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

export function DialogueAjouterPlat({ fermer }: { fermer: () => void }) {
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

export function PlatsPrepares() {
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
