/** Icônes : dessins Lucide (licence ISC), en sprite SVG, toujours décoratives. */
const TRACES = {
  bocal: (
    <>
      <rect x="7" y="2" width="10" height="3" rx="1" />
      <path d="M6 8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" />
      <path d="M6 12h12" />
    </>
  ),
  calendrier: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  courses: <path d="m3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8" />,
  flamme: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
  frigo: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M5 10h14M9 5v2M9 13v3" />
    </>
  ),
  livre: <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />,
  bol: <path d="M3 11h18a9 9 0 0 1-18 0zM8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5" />,
  soleil: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
    </>
  ),
  lune: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />,
  systeme: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" />
    </>
  ),
  cadenas: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  maquette: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </>
  ),
} as const;

export type NomIcone = keyof typeof TRACES;

export function SpriteIcones() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" hidden>
      {Object.entries(TRACES).map(([nom, trace]) => (
        <symbol key={nom} id={`i-${nom}`} viewBox="0 0 24 24">
          {trace}
        </symbol>
      ))}
    </svg>
  );
}

export function Icone({ nom }: { nom: NomIcone }) {
  return (
    <svg class="icone" aria-hidden="true">
      <use href={`#i-${nom}`} />
    </svg>
  );
}
