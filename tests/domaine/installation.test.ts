import { describe, expect, it } from 'vitest';
import { plateforme } from '../../src/domaine/installation';

describe('installation', () => {
  it('reconnaît l’iPhone (Safari, Brave, Chrome), l’iPad, Android et l’ordinateur', () => {
    const iphone =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
    const chromeIos =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1';
    const ipad =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';
    const android =
      'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';
    const windows =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
    expect(plateforme(iphone, 5)).toBe('ios');
    expect(plateforme(chromeIos, 5)).toBe('ios');
    expect(plateforme(ipad, 5)).toBe('ios');
    // Le même agent sur un vrai Mac (sans écran tactile) : un ordinateur.
    expect(plateforme(ipad, 0)).toBe('autre');
    expect(plateforme(android, 5)).toBe('android');
    expect(plateforme(windows, 0)).toBe('autre');
  });
});
