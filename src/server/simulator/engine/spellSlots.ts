/**
 * Pure helpers over `EngineCombatant.spellSlotsRemaining` (issue #5,
 * milestone 11) — a plain `{ [level]: remaining }` map, spent at the lowest
 * eligible level first (5e's own convention: nothing forces upcasting), one
 * slot per cast, never regenerated mid-fight (no rest during a simulated
 * encounter, same rule `maxUsesPerEncounter` already follows).
 */

/** True when at least one slot at or above `requiredLevel` still has uses
 * left — `runEncounter.ts`'s `availableActionIds` gates a slot-consuming
 * action on this before it's ever offered to the targeting AI. */
export const hasAvailableSlot = (
  remaining: Readonly<Record<number, number>>,
  requiredLevel: number,
): boolean =>
  Object.entries(remaining).some(
    ([level, count]) => Number(level) >= requiredLevel && count > 0,
  );

/** Spends one slot at the lowest level `>= requiredLevel` that still has
 * uses left. A no-op (returns `remaining` unchanged) if none qualify —
 * callers only reach this after `hasAvailableSlot` already gated the
 * choice, so that should never happen in practice, but this stays a safe
 * no-op rather than throwing either way. */
export const consumeLowestSlot = (
  remaining: Readonly<Record<number, number>>,
  requiredLevel: number,
): Record<number, number> => {
  const eligibleLevels = Object.keys(remaining)
    .map(Number)
    .filter(level => level >= requiredLevel && remaining[level]! > 0)
    .sort((a, b) => a - b);

  const levelToSpend = eligibleLevels[0];
  if (levelToSpend === undefined) return remaining;

  return { ...remaining, [levelToSpend]: remaining[levelToSpend]! - 1 };
};
