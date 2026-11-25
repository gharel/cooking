import { describe, expect, it } from 'vitest';
import { FORMAT_EXPORT, VERSION_EXPORT, lireExport } from '../../src/domaine/validation';
import { recettesDeDepart } from '../../src/donnees/recettes-de-depart';

const exportValide = () => ({
  format: FORMAT_EXPORT,
  version: VERSION_EXPORT,
  exporteLe: '2026-11-25T10:00:00.000Z',
  recettes: structuredClone(recettesDeDepart().slice(0, 2)),
  photos: [] as unknown[],
});

describe('lireExport', () => {
  it('accepte un export valide', () => {
    const lecture = lireExport(exportValide());
    expect(lecture.ok).toBe(true);
  });

  it.each([
    ['un autre format', (e: ReturnType<typeof exportValide>) => ({ ...e, format: 'autre' })],
    ['une version inconnue', (e: ReturnType<typeof exportValide>) => ({ ...e, version: 2 })],
    ['sans liste de recettes', (e: ReturnType<typeof exportValide>) => ({ ...e, recettes: undefined })],
  ])('refuse %s', (_, abimer) => {
    expect(lireExport(abimer(exportValide())).ok).toBe(false);
  });

  it('refuse une recette sans nom, un poste inconnu ou une dépendance introuvable, en listant les erreurs', () => {
    const e = exportValide();
    const [premiere, seconde] = e.recettes as unknown as Record<string, unknown>[];
    if (!premiere || !seconde) throw new Error('jeu de test incomplet');
    premiere.nom = ' ';
    const [etape1, etape2] = seconde.etapes as Record<string, unknown>[];
    if (!etape1 || !etape2) throw new Error('jeu de test incomplet');
    etape1.poste = 'micro-ondes';
    etape2.apres = ['inexistante'];
    const lecture = lireExport(e);
    expect(lecture.ok).toBe(false);
    if (!lecture.ok) {
      expect(lecture.erreurs.join('\n')).toMatch(/nom manquant/);
      expect(lecture.erreurs.join('\n')).toMatch(/poste : valeur invalide/);
      expect(lecture.erreurs.join('\n')).toMatch(/étape inconnue \(inexistante\)/);
    }
  });

  it('refuse une recette qui renvoie à une photo absente du fichier', () => {
    const e = exportValide();
    (e.recettes[0] as { photos: string[] }).photos = ['photo-1'];
    expect(lireExport(e).ok).toBe(false);
  });

  it('n’accepte pas autre chose qu’un objet', () => {
    expect(lireExport(null).ok).toBe(false);
    expect(lireExport('texte').ok).toBe(false);
  });
});
