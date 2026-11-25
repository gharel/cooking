import { signal } from '@preact/signals';
import type { Plat, Reste } from '../domaine/stock';
import { obtenirBase } from '../donnees/base';

export const plats = signal<Plat[]>([]);
export const restes = signal<Reste[]>([]);

export async function rafraichirStock(): Promise<void> {
  const base = obtenirBase();
  plats.value = await base.plats.toArray();
  restes.value = await base.restes.toArray();
}
