import { recettes } from '../../app/bibliotheque-etat';
import { versDate } from '../../domaine/dates';
import type { Fournee } from '../../domaine/fournee';
import type { Tache } from '../../domaine/ordonnanceur';

export const deux = (n: number) => String(n).padStart(2, '0');
export const heureDe = (baseMs: number, minutes: number) => {
  const d = new Date(baseMs + minutes * 60_000);
  return d.getMinutes() === 0 ? `${d.getHours()} h` : `${d.getHours()} h ${deux(d.getMinutes())}`;
};
export const compteARebours = (minutes: number) => {
  const s = Math.max(0, Math.round(minutes * 60));
  return `${deux(Math.floor(s / 60))}:${deux(s % 60)}`;
};
export const debutPrevu = (f: Fournee) => {
  const [h, m] = f.heure.split(':').map(Number);
  const d = versDate(f.sessionLe);
  d.setHours(h ?? 14, m ?? 0, 0, 0);
  return d.getTime();
};

export function nomsRecettes(t: Tache | undefined): string {
  if (!t) return '';
  return t.recettes.map((id) => recettes.value.find((r) => r.id === id)?.nom ?? '').join(' + ');
}
