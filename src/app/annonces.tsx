import { signal } from '@preact/signals';

interface Annonce {
  texte: string;
  action?: { libelle: string; faire: () => void | Promise<void> };
}

const courante = signal<Annonce | null>(null);
let minuterie: ReturnType<typeof setTimeout> | undefined;

/** Message bref en bas d’écran ; avec une action (« Annuler »), il reste 10 s. */
export function annoncer(texte: string, action?: Annonce['action']): void {
  clearTimeout(minuterie);
  courante.value = action ? { texte, action } : { texte };
  minuterie = setTimeout(() => (courante.value = null), action ? 10_000 : 4_000);
}

export function Annonces() {
  const a = courante.value;
  return (
    <div class="annonce-zone" role="status" aria-live="polite">
      {a && (
        <div class="annonce">
          <span>{a.texte}</span>
          {a.action && (
            <button
              type="button"
              class="bouton bouton-annonce"
              onClick={async () => {
                const action = a.action;
                courante.value = null;
                await action?.faire();
              }}
            >
              {a.action.libelle}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
