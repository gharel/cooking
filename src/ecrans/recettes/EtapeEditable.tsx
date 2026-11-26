import { Icone } from '../../app/icones';
import { POSTES, type Etape, type Poste } from '../../domaine/modele';

export function EtapeEditable({
  etape,
  rang,
  precedentes,
  changer,
  retirer,
}: {
  etape: Etape;
  rang: number;
  precedentes: Etape[];
  changer: (e: Etape) => void;
  retirer: () => void;
}) {
  const id = `etape-${etape.id}`;
  return (
    <fieldset class="etape-editable">
      <legend>Étape {rang}</legend>
      <label class="champ">
        <span class="visuellement-cache">Texte de l’étape {rang}</span>
        <textarea
          rows={2}
          value={etape.texte}
          onInput={(e) => changer({ ...etape, texte: e.currentTarget.value })}
        />
      </label>
      <div class="etape-reglages">
        <label class="champ champ-court">
          <span>Poste</span>
          <select
            value={etape.poste}
            onChange={(e) => changer({ ...etape, poste: e.currentTarget.value as Poste })}
          >
            {Object.entries(POSTES).map(([valeur, nom]) => (
              <option key={valeur} value={valeur}>
                {nom}
              </option>
            ))}
          </select>
        </label>
        <label class="champ champ-court">
          <span>Durée (min)</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            class={etape.devinee ? 'devinee' : undefined}
            aria-describedby={etape.devinee ? `${id}-devinee` : undefined}
            value={etape.dureeMin}
            onInput={(e) =>
              changer({ ...etape, dureeMin: Number(e.currentTarget.value) || 0, devinee: false })
            }
          />
        </label>
        {etape.devinee && (
          <span id={`${id}-devinee`} class="pastille pastille-bientot">
            Durée devinée, à vérifier
          </span>
        )}
      </div>
      <div class="etape-cases">
        <label class="case">
          <input
            type="checkbox"
            checked={etape.active}
            onChange={(e) => changer({ ...etape, active: e.currentTarget.checked })}
          />
          Occupe le cuisinier
        </label>
        <label class="case">
          <input
            type="checkbox"
            checked={etape.facultative}
            onChange={(e) => changer({ ...etape, facultative: e.currentTarget.checked })}
          />
          Facultative
        </label>
        <label class="case">
          <input
            type="checkbox"
            checked={etape.anticiper === 'veille'}
            onChange={(e) => changer({ ...etape, anticiper: e.currentTarget.checked ? 'veille' : null })}
          />
          À faire la veille
        </label>
      </div>
      {precedentes.length > 0 && (
        <div class="etape-cases" role="group" aria-label={`Étape ${rang} : à faire après`}>
          <span class="etiquette-champ">Après</span>
          {precedentes.map((p, i) => (
            <label key={p.id} class="case">
              <input
                type="checkbox"
                checked={etape.apres.includes(p.id)}
                onChange={(e) =>
                  changer({
                    ...etape,
                    apres: e.currentTarget.checked
                      ? [...etape.apres, p.id]
                      : etape.apres.filter((d) => d !== p.id),
                  })
                }
              />
              l’étape {i + 1}
            </label>
          ))}
        </div>
      )}
      <button type="button" class="bouton bouton-texte bouton-petit" onClick={retirer}>
        <Icone nom="poubelle" />
        Retirer l’étape {rang}
      </button>
    </fieldset>
  );
}
