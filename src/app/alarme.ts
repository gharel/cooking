/** Signal de fin de minuteur : bips, vibration, notification si la page n’est pas au premier plan. */
let contexte: AudioContext | undefined;

/** À appeler lors d’un geste (lancement de la session) : les navigateurs exigent un geste pour le son. */
export function preparerSon(): void {
  try {
    contexte ??= new AudioContext();
    void contexte.resume();
  } catch {
    // pas de son disponible
  }
}

export async function demanderNotifications(): Promise<void> {
  try {
    if ('Notification' in window && Notification.permission === 'default')
      await Notification.requestPermission();
  } catch {
    // refusé ou non pris en charge
  }
}

export function sonner(texte: string): void {
  try {
    if (contexte) {
      for (let i = 0; i < 3; i++) {
        const osc = contexte.createOscillator();
        const gain = contexte.createGain();
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.connect(gain).connect(contexte.destination);
        const debut = contexte.currentTime + i * 0.35;
        osc.start(debut);
        osc.stop(debut + 0.2);
      }
    }
    navigator.vibrate?.([300, 150, 300]);
    if (
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState !== 'visible'
    )
      new Notification('Fournée', { body: texte, tag: texte });
  } catch {
    // tant pis pour le signal : l’écran affiche « Terminé »
  }
}

let verrou: WakeLockSentinel | null = null;
let voulu = false;

async function acquerir(): Promise<void> {
  try {
    if (voulu && !verrou && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      verrou = await navigator.wakeLock.request('screen');
      verrou.addEventListener('release', () => (verrou = null));
    }
  } catch {
    verrou = null;
  }
}

document.addEventListener('visibilitychange', () => void acquerir());

/** Garde l’écran allumé pendant la session (repris au retour sur la page). */
export async function garderEcranAllume(oui: boolean): Promise<void> {
  voulu = oui;
  if (oui) await acquerir();
  else {
    await verrou?.release();
    verrou = null;
  }
}
