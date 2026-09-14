import type { EngineCombatant } from '~/server/simulator/engine/types';

/** At or below this fraction of max HP, a combatant tries to put distance
 * between itself and its nearest threat before acting. */
export const RETREAT_HP_FRACTION = 0.25;

/**
 * The HP-threshold-retreat tier of the targeting AI (see `selectAction`'s
 * own doc comment for the full heuristic tier list this engine implements).
 * Simpler than BattleCast's own class-flavored version — its writeup notes
 * "barbarians never flee" — this engine has no morale/class-behaviour model
 * yet, so retreat applies uniformly to every combatant with HP left and legs
 * to run on; a documented simplification, not an oversight.
 */
export const shouldRetreat = (self: EngineCombatant): boolean =>
  self.speed > 0 &&
  self.currentHitPoints > 0 &&
  self.currentHitPoints / self.maxHitPoints <= RETREAT_HP_FRACTION;
