import type { ComponentType } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * Écran chargé à la demande (morceau de JavaScript séparé) : le démarrage reste léger. En attendant, un
 * titre de remplacement garde la structure de la page ; s’il avait le focus, le vrai titre le reprend.
 */
export function aLaDemande<P extends object>(charger: () => Promise<ComponentType<P>>, titre: string) {
  let Composant: ComponentType<P> | null = null;
  let promesse: Promise<void> | null = null;
  const precharger = () =>
    (promesse ??= charger().then((c) => {
      Composant = c;
    }));

  function Ecran(props: P) {
    const [, forcer] = useState(0);
    const provisoire = useRef<HTMLHeadingElement>(null);
    const reprendreFocus = useRef(false);
    useEffect(() => {
      // Le module a pu arriver entre l’affichage provisoire et cet effet : il faut alors réafficher.
      if (Composant) {
        reprendreFocus.current = document.activeElement === provisoire.current;
        forcer((n) => n + 1);
        return;
      }
      let actif = true;
      void precharger().then(() => {
        reprendreFocus.current = document.activeElement === provisoire.current;
        if (actif) forcer((n) => n + 1);
      });
      return () => {
        actif = false;
      };
    }, []);
    useEffect(() => {
      if (Composant && reprendreFocus.current) {
        reprendreFocus.current = false;
        document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
      }
    });
    if (Composant) return <Composant {...props} />;
    return (
      <section class="vue">
        <h1 ref={provisoire} tabIndex={-1}>
          {titre}
        </h1>
        <p class="aide">Chargement…</p>
      </section>
    );
  }
  return Object.assign(Ecran, { precharger });
}
