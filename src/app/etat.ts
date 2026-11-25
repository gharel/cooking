import { signal } from '@preact/signals';
import type { Route } from './routage';

/** Écran courant, tiré de l’ancre de l’adresse (voir main.tsx). */
export const route = signal<Route>({ ecran: 'semaine' });
