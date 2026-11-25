import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Icone } from './icones';

interface Props {
  id: string;
  surtitre?: string;
  titre: string;
  /** Demande de fermeture (Échap, croix, Annuler) : au parent de confirmer si besoin. */
  onFermer: () => void;
  children: ComponentChildren;
  pied?: ComponentChildren;
  etroit?: boolean;
}

/** Fenêtre modale accessible (élément dialog natif) : plein écran sur téléphone. */
export function Dialogue({ id, surtitre, titre, onFermer, children, pied, etroit }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    d?.querySelector<HTMLElement>('input, select, textarea, button:not(.bouton-icone)')?.focus();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      class={`editeur${etroit ? ' dialogue-etroit' : ''}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onFermer();
      }}
    >
      <div class="editeur-forme">
        <div class="editeur-entete">
          <div>
            {surtitre && <p class="surtitre">{surtitre}</p>}
            <h2 id={id}>{titre}</h2>
          </div>
          <button
            type="button"
            class="bouton bouton-secondaire bouton-icone"
            aria-label="Fermer"
            onClick={onFermer}
          >
            <Icone nom="croix" />
          </button>
        </div>
        <div class="editeur-corps">{children}</div>
        {pied && <div class="editeur-pied">{pied}</div>}
      </div>
    </dialog>
  );
}
