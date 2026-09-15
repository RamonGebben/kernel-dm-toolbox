import type { EngineCombatant } from '~/server/simulator/engine/types';

/**
 * 5e resistance/immunity/vulnerability, applied per damage instance —
 * immune zeroes it, resistant halves it (rounded down), vulnerable doubles
 * it. Matches upstream Open5e's `damage_resistances`/`damage_immunities`/
 * `damage_vulnerabilities` slugs (lowercase damage-type words: `"fire"`,
 * `"poison"`, …), compared case-insensitively. `damageType` null means an
 * untyped effect — nothing to resist, returned unchanged. See
 * `EngineCombatant`'s own doc comment for why these three lists are empty
 * for every non-library combatant today.
 *
 * `hasResistAll` (issue #5, milestone 10 — the Petrified condition's "has
 * resistance to all damage" rule) folds in as an extra resistance source: it
 * doesn't stack with an existing type-specific resistance (still just
 * halved once), and per 5e's own resistance/vulnerability-cancel rule, a
 * type the target would otherwise be vulnerable to lands as plain, unscaled
 * damage instead of doubled.
 */
export const mitigateDamage = (
  damage: number,
  damageType: string | null,
  target: Pick<
    EngineCombatant,
    'damageImmunities' | 'damageResistances' | 'damageVulnerabilities'
  >,
  hasResistAll = false,
): number => {
  if (!damageType || damage <= 0) return damage;
  const type = damageType.toLowerCase();

  if (target.damageImmunities.some(entry => entry.toLowerCase() === type)) {
    return 0;
  }

  const resistant =
    hasResistAll ||
    target.damageResistances.some(entry => entry.toLowerCase() === type);
  const vulnerable = target.damageVulnerabilities.some(
    entry => entry.toLowerCase() === type,
  );

  if (resistant && vulnerable) return damage;
  if (resistant) return Math.floor(damage / 2);
  if (vulnerable) return damage * 2;

  return damage;
};
