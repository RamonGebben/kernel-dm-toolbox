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
 */
export const mitigateDamage = (
  damage: number,
  damageType: string | null,
  target: Pick<
    EngineCombatant,
    'damageImmunities' | 'damageResistances' | 'damageVulnerabilities'
  >,
): number => {
  if (!damageType || damage <= 0) return damage;
  const type = damageType.toLowerCase();

  if (target.damageImmunities.some(entry => entry.toLowerCase() === type)) {
    return 0;
  }
  if (target.damageResistances.some(entry => entry.toLowerCase() === type)) {
    return Math.floor(damage / 2);
  }
  if (
    target.damageVulnerabilities.some(entry => entry.toLowerCase() === type)
  ) {
    return damage * 2;
  }

  return damage;
};
