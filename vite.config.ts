import { cpSync } from 'node:fs';
import preact from '@preact/preset-vite';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/** La maquette reste en ligne sous /cooking/maquette/ : référence visuelle des écrans à venir. */
function copierMaquette(): Plugin {
  return {
    name: 'copier-maquette',
    apply: 'build',
    closeBundle() {
      cpSync('maquette', 'dist/maquette', { recursive: true });
    },
  };
}

// Publié sous https://gharel.github.io/cooking/ : même chemin pour le build et son aperçu (tests e2e).
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/cooking/' : '/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      pwaAssets: { config: true, overrideManifestIcons: true, injectThemeColor: false },
      manifest: {
        name: 'Fournée',
        short_name: 'Fournée',
        description: 'Batch cooking : vos recettes, une session orchestrée, un frigo sous contrôle.',
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#faf7f2',
        theme_color: '#faf7f2',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Polices : seuls les sous-ensembles latins servent au français.
        globIgnores: ['maquette/**', '**/*vietnamese*', '**/*cyrillic*', '**/*greek*'],
        navigateFallbackDenylist: [/\/maquette\//],
        cleanupOutdatedCaches: true,
        // Mise à jour automatique : le nouveau service worker prend la main sans attendre.
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
    copierMaquette(),
  ],
}));
