import { signal } from '@preact/signals';
import { plateforme as detecter, type Plateforme } from '../domaine/installation';

/** Invitation à installer du navigateur (Chrome, Edge, Brave, Samsung Internet). */
interface InviteInstallation extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const invite = signal<InviteInstallation | null>(null);
export const installee = signal(false);
export const plateforme: Plateforme = detecter(navigator.userAgent, navigator.maxTouchPoints);

const autonome = () =>
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Au démarrage, avant que le navigateur ne propose l’installation : on garde son invitation pour le bouton. */
export function demarrerInstallation(): void {
  installee.value = autonome();
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    invite.value = e as InviteInstallation;
  });
  addEventListener('appinstalled', () => {
    installee.value = true;
    invite.value = null;
  });
}

/** Le bouton « Installer » a un sens : pas encore installée, et le navigateur sait faire ou on peut expliquer. */
export const installationPossible = (): boolean =>
  !installee.value && (invite.value !== null || plateforme !== 'autre');

/** Ouvre la fenêtre d’installation du navigateur ; renvoie false s’il faut plutôt expliquer la marche à suivre. */
export async function installer(): Promise<boolean> {
  const i = invite.value;
  if (!i) return false;
  // Une invitation ne sert qu’une fois.
  invite.value = null;
  await i.prompt();
  const { outcome } = await i.userChoice;
  if (outcome === 'accepted') installee.value = true;
  return true;
}
