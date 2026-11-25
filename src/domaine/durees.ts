import type { Recette } from './modele';

type AvecEtapes = Pick<Recette, 'etapes'>;

/** Temps pendant lequel le cuisinier est occupé (étapes actives, hors facultatives, anticipées et sous-recettes). */
export function dureeActive(r: AvecEtapes): number {
  return r.etapes
    .filter((e) => e.active && !e.facultative && !e.anticiper && !e.sousRecetteId)
    .reduce((total, e) => total + e.dureeMin, 0);
}

/**
 * Durée jusqu’au plat prêt, avec un seul cuisinier : les étapes actives s’enchaînent, les étapes
 * passives (cuisson, four) avancent seules. Ne comptent pas : le refroidissement final, les étapes
 * facultatives, celles à anticiper (la veille) et les sous-recettes (supposées prêtes).
 */
export function dureeTotale(r: AvecEtapes): number {
  const ignorees = new Set(
    r.etapes.filter((e) => e.facultative || e.anticiper || e.sousRecetteId).map((e) => e.id),
  );
  const restantes = r.etapes.filter((e) => !ignorees.has(e.id));
  // Refroidissement final : une étape de repos dont aucune autre étape retenue ne dépend.
  const finales = restantes.filter(
    (e) => e.poste === 'repos' && !restantes.some((autre) => autre.apres.includes(e.id)),
  );
  finales.forEach((e) => ignorees.add(e.id));
  let aPlacer = restantes.filter((e) => !ignorees.has(e.id));

  const fin = new Map<string, number>();
  let cuisinierLibre = 0;
  while (aPlacer.length > 0) {
    let choix: { index: number; debut: number } | null = null;
    aPlacer.forEach((e, index) => {
      if (!e.apres.every((d) => ignorees.has(d) || fin.has(d))) return;
      const pret = Math.max(0, ...e.apres.map((d) => fin.get(d) ?? 0));
      const debut = e.active ? Math.max(pret, cuisinierLibre) : pret;
      if (!choix || debut < choix.debut) choix = { index, debut };
    });
    if (!choix) break; // dépendance circulaire ou introuvable : on s’arrête là
    const { index, debut } = choix as { index: number; debut: number };
    const etape = aPlacer[index];
    if (!etape) break;
    fin.set(etape.id, debut + etape.dureeMin);
    if (etape.active) cuisinierLibre = debut + etape.dureeMin;
    aPlacer = aPlacer.filter((_, i) => i !== index);
  }
  return Math.max(0, ...fin.values());
}
