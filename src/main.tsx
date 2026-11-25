import '@fontsource-variable/figtree';
import '@fontsource-variable/fraunces';
import './styles/jetons.css';
import './styles/base.css';
import './styles/composants.css';
import './styles/coque.css';
import './styles/recettes.css';
import './styles/semaine.css';
import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { demarrerBibliotheque } from './app/bibliotheque-etat';
import { Coque } from './app/Coque';
import { demarrerFournee } from './app/fournee-etat';
import { route } from './app/etat';
import { lireAncre } from './app/routage';
import { demarrerTypographie } from './app/typographie-dom';

const montage = document.getElementById('app');
if (!montage) throw new Error('Point de montage #app introuvable');

route.value = lireAncre(location.hash);
addEventListener('hashchange', () => {
  route.value = lireAncre(location.hash);
});

render(<Coque />, montage);
demarrerTypographie(montage);
void demarrerBibliotheque();
void demarrerFournee();

// Hors ligne : tout le site est mis en cache ; une nouvelle version s’installe d’elle-même.
registerSW({ immediate: true });
