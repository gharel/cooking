import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

const fond = { background: '#b4532a' };
// L’icône a déjà sa marge (le dessin occupe 40 px sur 64) : peu de marge en plus, sinon elle paraît minuscule.
const marge = 0.1;

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: marge, resizeOptions: fond },
    apple: { ...minimal2023Preset.apple, padding: marge, resizeOptions: fond },
  },
  images: ['public/favicon.svg'],
});
