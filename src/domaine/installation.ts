/** Plateforme, pour choisir la façon d’installer l’application. */
export type Plateforme = 'ios' | 'android' | 'autre';

/** iPhone et iPad (iPadOS se présente comme un Mac, mais tactile), Android, ou autre (ordinateur). */
export function plateforme(agent: string, pointsTactiles: number): Plateforme {
  if (/iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && pointsTactiles > 1)) return 'ios';
  if (/Android/.test(agent)) return 'android';
  return 'autre';
}
