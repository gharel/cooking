import { useRef, useState } from 'preact/hooks';
import { AideInstallation } from './AideInstallation';
import { Icone } from './icones';
import { installationPossible, installer } from './installation';

/**
 * « Installer » : la fenêtre du navigateur si elle existe, sinon la marche à suivre (iPhone notamment).
 * La marche à suivre est chargée avec le bandeau : à la demande, le découpage des morceaux coûtait plus cher.
 */
export function BoutonInstaller() {
  const [aide, setAide] = useState(false);
  const bouton = useRef<HTMLButtonElement>(null);
  if (!installationPossible() && !aide) return null;
  return (
    <>
      {installationPossible() && (
        <button
          ref={bouton}
          type="button"
          class="bouton bouton-secondaire bouton-petit bouton-installer"
          onClick={async () => {
            if (!(await installer())) setAide(true);
          }}
        >
          <Icone nom="exporter" />
          Installer
        </button>
      )}
      {aide && (
        <AideInstallation
          onFermer={() => {
            setAide(false);
            queueMicrotask(() => bouton.current?.focus());
          }}
        />
      )}
    </>
  );
}
