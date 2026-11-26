import { describe, expect, it } from 'vitest';
import { listeDeCourses } from '../../src/domaine/courses';
import { ajouterPlat, alertes, changerRepas, nouvelleFournee, type Fournee } from '../../src/domaine/fournee';
import { completerReglages, equipementDeSession } from '../../src/domaine/reglages';
import {
  ADRESSES_DE_DEPART,
  DINER_DEHORS,
  appliquerChoix,
  calendrierDesDiners,
  delaiAvantDiner,
  dinerDuSoir,
  lienItineraire,
  lienTelephone,
  normaliserLien,
  optionsRoulette,
  platsDuSoir,
  tirer,
  type Adresse,
} from '../../src/domaine/soir';
import { texteDeLaFournee } from '../../src/domaine/partage';
import type { Plat } from '../../src/domaine/stock';
import { recettesDeDepart } from '../../src/donnees/recettes-de-depart';

const recettes = recettesDeDepart();
// Session le dimanche 29 novembre 2026 : repas du lundi 30 novembre au dimanche 6 décembre.
const fournee = () => nouvelleFournee('f1', '2026-11-25', '2026-11-25T10:00:00.000Z');
const soirDu = (f: Fournee, jour: string) => f.repas.findIndex((r) => r.jour === jour && r.moment === 'soir');
const prevoir = (f: Fournee, jour: string, recetteId: string | null, platId: string | null = null) =>
  changerRepas(f, soirDu(f, jour), { recetteId, platId });

const plat = (champs: Partial<Plat>): Plat => ({
  id: 'p1',
  recetteId: 'depart-chili',
  nom: 'Chili con carne',
  portions: 4,
  lieu: 'frigo',
  prepareLe: '2026-11-29',
  limite: '2026-12-02',
  fourneeId: 'f1',
  ...champs,
});

describe('le dîner de ce soir', () => {
  it('rien de prévu : plan B', () => {
    const d = dinerDuSoir([fournee()], recettes, [], '2026-12-01');
    expect(d.source).toBe('libre');
    expect(d.nom).toBeNull();
    expect(d.conseil).toMatch(/roulette/);
  });

  it('un plat de la fournée à venir, puis préparé à la session', () => {
    let f = prevoir(ajouterPlat(fournee(), 'depart-chili', 4), '2026-12-01', 'depart-chili');
    const avant = dinerDuSoir([f], recettes, [], '2026-12-01');
    expect(avant).toMatchObject({ source: 'fournee', nom: 'Chili con carne', fourneeId: 'f1' });
    expect(avant.conseil).toMatch(/Prévu à la session/);
    f = { ...f, statut: 'terminee' };
    expect(dinerDuSoir([f], recettes, [], '2026-12-01').conseil).toMatch(/réchauffer/);
  });

  it('un plat du congélateur, une recette du soir', () => {
    const glace = plat({ id: 'p2', lieu: 'congelateur' });
    let f = prevoir(fournee(), '2026-12-01', null, 'p2');
    expect(dinerDuSoir([f], recettes, [glace], '2026-12-01')).toMatchObject({ source: 'plat' });
    expect(dinerDuSoir([f], recettes, [glace], '2026-12-01').conseil).toMatch(/congélateur/);
    f = prevoir(fournee(), '2026-12-02', 'soir-croque-monsieur');
    const d = dinerDuSoir([f], recettes, [], '2026-12-02');
    expect(d).toMatchObject({ source: 'soir', nom: 'Croque-monsieur' });
    expect(d.conseil).toMatch(/^À cuisiner ce soir : environ/);
  });

  it('un choix de dernière minute passe avant le planning, le jour dit seulement', () => {
    const f = prevoir(ajouterPlat(fournee(), 'depart-chili', 4), '2026-12-01', 'depart-chili');
    const prevu = dinerDuSoir([f], recettes, [], '2026-12-01');
    const gino = ADRESSES_DE_DEPART[1] as Adresse;
    const choix = { jour: '2026-12-01', recetteId: null, adresseId: gino.id };
    expect(appliquerChoix(prevu, choix, recettes, ADRESSES_DE_DEPART)).toMatchObject({
      source: 'adresse',
      nom: 'Gino Pizza',
      adresseId: gino.id,
    });
    expect(appliquerChoix(prevu, { ...choix, jour: '2026-11-30' }, recettes, ADRESSES_DE_DEPART)).toBe(prevu);
    const recette = { jour: '2026-12-01', recetteId: 'soir-carbonara', adresseId: null };
    expect(appliquerChoix(prevu, recette, recettes, ADRESSES_DE_DEPART).nom).toBe('Pâtes carbonara');
  });
});

describe('les recettes du soir dans la semaine', () => {
  it('deux soirs pour 2 personnes : 4 portions aux courses, hors session, sans alerte', () => {
    let f = ajouterPlat(fournee(), 'depart-chili', 4);
    f = prevoir(f, '2026-12-03', 'soir-croque-monsieur');
    f = prevoir(f, '2026-12-05', 'soir-croque-monsieur');
    const duSoir = platsDuSoir(f, recettes, 2);
    expect(duSoir).toEqual([{ recetteId: 'soir-croque-monsieur', portions: 4 }]);
    expect(f.plats.map((p) => p.recetteId)).toEqual(['depart-chili']);
    expect(alertes(f, recettes, 2).filter((a) => a.recetteId === 'soir-croque-monsieur')).toEqual([]);
    const seul = listeDeCourses(f.plats, recettes, []);
    const avec = listeDeCourses([...f.plats, ...duSoir], recettes, []);
    const lignes = avec.rayons.flatMap((r) => r.lignes.map((l) => l.texte)).join('\n');
    expect(lignes).toMatch(/pain de mie/);
    expect(avec.total).toBeGreaterThan(seul.total);
  });

  it('une recette du soir mise dans la fournée suit la fournée', () => {
    let f = ajouterPlat(fournee(), 'soir-fajitas-poulet', 4);
    f = prevoir(f, '2026-12-01', 'soir-fajitas-poulet');
    expect(platsDuSoir(f, recettes, 2)).toEqual([]);
  });
});

describe('roulette', () => {
  it('tire uniformément : le hasard injecté choisit l’option', () => {
    const options = ['a', 'b', 'c', 'd'];
    expect(tirer(options, () => 0)).toBe('a');
    expect(tirer(options, () => 0.25)).toBe('b');
    expect(tirer(options, () => 0.74)).toBe('c');
    expect(tirer(options, () => 0.999999)).toBe('d');
    expect(tirer([], () => 0.5)).toBeNull();
    const comptes = new Map<string, number>();
    for (let i = 0; i < 400; i++) {
      const x = tirer(options, () => i / 400) ?? '';
      comptes.set(x, (comptes.get(x) ?? 0) + 1);
    }
    expect([...comptes.values()]).toEqual([100, 100, 100, 100]);
  });

  it('propose les recettes du soir, les adresses, ou les deux', () => {
    const tout = optionsRoulette(recettes, ADRESSES_DE_DEPART, 'tout');
    const cuisiner = optionsRoulette(recettes, ADRESSES_DE_DEPART, 'cuisiner');
    const chercher = optionsRoulette(recettes, ADRESSES_DE_DEPART, 'chercher');
    expect(cuisiner).toHaveLength(recettes.filter((r) => r.soir).length);
    expect(cuisiner.every((o) => o.type === 'recette')).toBe(true);
    expect(chercher.map((o) => o.nom)).toEqual(['Burger King', 'Gino Pizza', 'Indi Kitch']);
    expect(tout).toHaveLength(cuisiner.length + chercher.length);
  });
});

describe('adresses', () => {
  it('liens : téléphone, itinéraire, site en http ou https seulement', () => {
    const a: Adresse = { ...(ADRESSES_DE_DEPART[0] as Adresse), telephone: '01 23 45 67 89' };
    expect(lienTelephone(a)).toBe('tel:0123456789');
    expect(lienItineraire(a)).toBe('https://www.google.com/maps/search/?api=1&query=Burger%20King');
    expect(normaliserLien('gino-pizza.example')).toBe('https://gino-pizza.example');
    expect(normaliserLien(' http://exemple.fr ')).toBe('http://exemple.fr');
    expect(normaliserLien('javascript:alert(1)')).toBe('https://alert(1)');
    expect(normaliserLien('')).toBe('');
  });
});

describe('agenda et rappel', () => {
  it('un événement par dîner prévu et par sortie du congélateur, avec alarme', () => {
    let f: Fournee = { ...ajouterPlat(fournee(), 'depart-chili', 4), statut: 'terminee' };
    f = prevoir(f, '2026-12-01', 'depart-chili');
    f = prevoir(f, '2026-12-04', 'depart-chili');
    f = prevoir(f, '2026-11-30', 'depart-chili');
    const glace = plat({ id: 'p9', lieu: 'congelateur' });
    const ics = calendrierDesDiners(
      [f],
      recettes,
      [glace],
      2,
      '19:30',
      '2026-12-01',
      new Date(Date.UTC(2026, 11, 1, 8)),
    );
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).not.toContain('DTSTART:20261130');
    expect(ics).toContain('DTSTART:20261201T193000');
    expect(ics).toContain('DTSTART:20261204T193000');
    expect(ics).toContain('SUMMARY:Dîner : Chili con carne');
    // Le chili du vendredi (5 jours après la session) est congelé : à sortir jeudi soir.
    expect(ics).toContain('SUMMARY:Sortir un plat du congélateur');
    expect(ics).toContain('DTSTART:20261203T203000');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(3);
    expect(ics).toContain('DTSTAMP:20261201T080000Z');
  });

  it('un dîner à l’extérieur : affiché, sans événement, et la semaine précédente n’est pas consultée', () => {
    const dehors = changerRepas(fournee(), soirDu(fournee(), '2026-12-01'), {
      recetteId: null,
      platId: null,
      dehors: true,
    });
    const autre = { ...prevoir(fournee(), '2026-12-01', 'depart-chili'), id: 'f0' };
    const d = dinerDuSoir([dehors, autre], recettes, [], '2026-12-01');
    expect(d).toMatchObject({ source: 'dehors', nom: DINER_DEHORS, recetteId: null });
    // Un choix de dernière minute passe avant.
    const choix = { jour: '2026-12-01', recetteId: 'soir-croque-monsieur', adresseId: null };
    expect(appliquerChoix(d, choix, recettes, []).nom).toBe('Croque-monsieur');
    const ics = calendrierDesDiners([dehors, autre], recettes, [], 2, '19:30', '2026-12-01', new Date());
    expect(ics).not.toContain('BEGIN:VEVENT');
    expect(texteDeLaFournee(dehors, recettes, [], '14 h')).toContain('- mardi soir : à l’extérieur');
  });

  it('délai avant le dîner', () => {
    expect(delaiAvantDiner(new Date(2026, 11, 1, 18, 30), '19:30')).toBe(3_600_000);
    expect(delaiAvantDiner(new Date(2026, 11, 1, 20, 0), '19:30')).toBe(-1_800_000);
  });
});

describe('réglages de la session à plusieurs', () => {
  it('reprend l’ancien nombre de cuisiniers sous forme de participants à nommer', () => {
    const r = completerReglages({ equipement: { feux: 4, fours: 1, cuisiniers: 2 } });
    expect(r.participants).toEqual(['Moi', 'Personne 2']);
    expect(equipementDeSession(r).cuisiniers).toBe(2);
    expect(completerReglages(undefined)).toMatchObject({
      participants: ['Moi'],
      laveVaisselle: true,
      heureDiner: '19:30',
      notificationDiner: false,
      choixDuSoir: null,
    });
    const trois = completerReglages({ participants: ['Guillaume', 'Hélène', 'Invité'] });
    expect(equipementDeSession(trois).cuisiniers).toBe(3);
  });
});
