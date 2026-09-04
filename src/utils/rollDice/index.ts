/**
 * Dice, with the randomness injected.
 *
 * A resolver that calls `Math.random()` directly cannot be tested; passing the
 * roller in means initiative can be asserted exactly. The default is the real
 * thing, so callers that do not care say nothing.
 */
export type RollD20 = () => number;

export const rollD20: RollD20 = () => Math.floor(Math.random() * 20) + 1;

/**
 * Initiative for a monster: d20 plus its precomputed bonus. Players roll their
 * own dice at the table and the DM types the result (DECISIONS #16).
 */
export const rollInitiative = (
  initiativeBonus: number | null,
  roll: RollD20 = rollD20,
): number => roll() + (initiativeBonus ?? 0);
