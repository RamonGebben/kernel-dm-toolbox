import { rollExpression } from '~/utils/rollDice';
import { type Rng, rollDie } from '~/server/simulator/engine/rng';

export type ParsedDice = { count: number; sides: number; bonus: number };

const DICE_PATTERN = /^(\d+)d(\d+)\s*(?:\+\s*(\d+))?$/i;

/**
 * Parses the dice notation `damageOnFailRoll` stores (`10d6`, `2d8+4`) —
 * the same format `parseCreatureActionSaveArea` writes at import time.
 * Returns null for anything that doesn't match rather than throwing, same
 * "degrade, don't block" spirit as that parser.
 */
export const parseDiceNotation = (notation: string): ParsedDice | null => {
  const match = notation.trim().match(DICE_PATTERN);
  if (!match) return null;

  return {
    count: Number(match[1]),
    sides: Number(match[2]),
    bonus: match[3] ? Number(match[3]) : 0,
  };
};

/**
 * Extracts the number of sides from a die-type label — `creature_action_
 * attacks.damageDieType` imports from Open5e as `D6`; the custom-creature
 * wizard's own free-text field defaults to `d6` but is unvalidated beyond
 * `.max(10)`, so a DM can type anything. Returns 0 (never a negative or
 * `NaN`) for anything with no digits, so a loader can treat it as "no die
 * damage from this column" rather than crash on `Math.random() * 0`-style
 * edge cases.
 */
export const parseDieSides = (label: string | null): number => {
  if (!label) return 0;
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

/** Rolls `count` dice of `sides` and sums them plus `bonus`, via this app's
 * existing `~/utils/rollDice` expression roller — this engine only supplies
 * the seeded per-die randomness (`rollDie`, from `./rng`), not a second
 * "sum N dice" accumulator. */
export const rollDice = (rng: Rng, dice: ParsedDice): number =>
  rollExpression(dice.count, dice.sides, dice.bonus, sides =>
    rollDie(rng, sides),
  ).total;
