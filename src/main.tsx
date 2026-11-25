import '@fontsource-variable/figtree';
import '@fontsource-variable/fraunces';
import './styles/jetons.css';
import './styles/base.css';
import './styles/composants.css';
import './styles/coque.css';
import './styles/recettes.css';
import './styles/semaine.css';
import './styles/session.css';
import './styles/frigo.css';
import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { demarrerBibliotheque } from './app/bibliotheque-etat';
import { Coque, prechargerEcrans } from './app/Coque';
import { demarrerFournee } from './app/fournee-etat';
import { chargerDerniereSession } from './app/session-etat';
import { rafraichirStock } from './app/stock-etat';
import { route } from './app/etat';
import { lireAncre } from './app/routage';
import { demarrerTypographie } from './app/typographie-dom';

const montage = document.getElementById('app');
if (!montage) throw new Error('Point de montage #app introuvable');

// Partage reçu d’une autre application (Android) : on ouvre l’import prérempli.
const recu = new URLSearchParams(location.search);
if (recu.has('texte') || recu.has('adresse')) {
  const texte = [recu.get('titre'), recu.get('texte')].filter(Boolean).join(String.fromCharCode(10));
  const adresse = recu.get('adresse') ?? /https?:\/\/\S+/.exec(texte)?.[0] ?? '';
  history.replaceState(null, '', `${location.pathname}#recettes`);
  void import('./ecrans/recettes/ImportWeb').then((m) => (m.importWeb.value = { texte, adresse }));
}

route.value = lireAncre(location.hash);
addEventListener('hashchange', () => {
  route.value = lireAncre(location.hash);
});

render(<Coque />, montage);
demarrerTypographie(montage);
setTimeout(prechargerEcrans, 0);
void demarrerBibliotheque();
void demarrerFournee();
void chargerDerniereSession();
void rafraichirStock();

// Hors ligne : tout le site est mis en cache ; une nouvelle version s’installe d’elle-même.
registerSW({ immediate: true });
