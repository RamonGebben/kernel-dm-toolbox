import { rollD20 } from '~/server/simulator/engine/rng';
import type { Rng } from '~/server/simulator/engine/rng';
import type {
  EngineActiveCondition,
  EngineCombatant,
  TurnLogEntry,
} from '~/server/simulator/engine/types';

const UNCONSCIOUS_CONDITION_KEY = 'unconscious';

/** The condition applied the instant a death-save-eligible combatant drops
 * to 0 HP — no fixed duration, no `saveEndsEachTurn` (its lifecycle is
 * governed by the death-save process itself, not the generic condition
 * tick/save-ends machinery), and not tied to anyone's concentration.
 * Removed on a natural 20 (`rollDeathSave`); otherwise persists until the
 * combatant dies or the encounter ends (no in-combat healing is modeled). */
const buildUnconsciousCondition = (): EngineActiveCondition => ({
  conditionKey: UNCONSCIOUS_CONDITION_KEY,
  roundsRemaining: null,
  saveEndsEachTurn: false,
  saveAbility: null,
  saveDc: null,
  concentrationSourceId: null,
});

const withoutUnconscious = (
  conditions: readonly EngineActiveCondition[],
): EngineActiveCondition[] =>
  conditions.filter(
    condition => condition.conditionKey !== UNCONSCIOUS_CONDITION_KEY,
  );

/**
 * 5e's own "damage remaining after HP hits 0 equals or exceeds your hit
 * point maximum" instant-death rule. Identical whether `preHp` was still
 * positive (a fresh drop to 0) or already 0 (an already-down combatant
 * taking more damage) — in the latter case there was no HP cushion left, so
 * the entire new hit counts as "remaining." `preHp` is always >= 0 by
 * construction (`resolveAction.ts`'s `applyDamage` clamps HP at 0 in
 * storage), so no extra branching is needed to distinguish the two cases.
 */
export const isMassiveDamageDeath = (
  preHp: number,
  damage: number,
  maxHitPoints: number,
): boolean => damage - preHp >= maxHitPoints;

export type DeathSaveRollOutcome = 'success' | 'failure' | 'nat1' | 'nat20';

export const classifyDeathSaveRoll = (roll: number): DeathSaveRollOutcome => {
  if (roll === 20) return 'nat20';
  if (roll === 1) return 'nat1';
  return roll >= 10 ? 'success' : 'failure';
};

export type DeathSaveTransition = {
  combatant: EngineCombatant;
  events: TurnLogEntry[];
};

/**
 * Applies whatever the death-save state machine says should happen when a
 * death-save-eligible combatant takes damage — called from
 * `runEncounter.ts`'s `applyUpdate` for every damage event, after `updated`
 * already has HP clamped by `resolveAction.ts`'s `applyDamage`. A no-op
 * (returns `updated` unchanged, no events) for a combatant with
 * `tracksDeathSaves` false, zero damage, or one already `downState:
 * 'dead'` (defensive — a dead combatant should never be re-targeted by
 * this engine's own targeting AI, which only picks from HP > 0 combatants,
 * but this function never assumes that from elsewhere).
 *
 * Three cases, checked in this order:
 * 1. Massive damage (`isMassiveDamageDeath`) — dies instantly, no saves.
 * 2. Already down (`dying` or `stable`) and takes more damage — one
 *    automatic death-save failure, two on a critical hit (5e's own rule);
 *    three accumulated failures (from this or any prior event) kills them
 *    the same way a fresh massive-damage hit would.
 * 3. Freshly dropped to 0 HP this hit (was > 0, now <= 0) — becomes
 *    unconscious and enters the dying state at 0/0 successes and failures,
 *    rather than being removed from the fight outright.
 *
 * This function only returns the `down`/`death-save` events new to
 * milestone 12 — `runEncounter.ts`'s `applyUpdate` still pushes the plain
 * `defeated` log entry itself for the instant-death and reached-3-
 * failures-here paths (by comparing `downState` before/after this call),
 * so `defeated` stays the single "this combatant is now permanently out"
 * signal for both monsters and PCs, unchanged from before this milestone —
 * `aggregateBatchResults`' kill attribution and the battle-viewer canvas
 * don't need to learn a second terminal log kind.
 */
export const applyDamageForDeathSaves = (
  previous: EngineCombatant,
  updated: EngineCombatant,
  damage: number,
  isCriticalHit: boolean,
): DeathSaveTransition => {
  if (
    !updated.tracksDeathSaves ||
    damage <= 0 ||
    previous.downState === 'dead'
  ) {
    return { combatant: updated, events: [] };
  }

  const preHp = previous.currentHitPoints;
  const wasDown =
    previous.downState === 'dying' || previous.downState === 'stable';

  if (isMassiveDamageDeath(preHp, damage, updated.maxHitPoints)) {
    return {
      combatant: {
        ...updated,
        downState: 'dead',
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
        activeConditions: withoutUnconscious(updated.activeConditions),
      },
      events: [],
    };
  }

  if (wasDown) {
    const failuresAdded: 1 | 2 = isCriticalHit ? 2 : 1;
    const failures = updated.deathSaveFailures + failuresAdded;
    const dies = failures >= 3;

    return {
      combatant: {
        ...updated,
        downState: dies ? 'dead' : 'dying',
        deathSaveFailures: dies ? 0 : failures,
        deathSaveSuccesses: dies ? 0 : updated.deathSaveSuccesses,
        activeConditions: dies
          ? withoutUnconscious(updated.activeConditions)
          : updated.activeConditions,
      },
      events: [
        {
          kind: 'death-save',
          combatantId: updated.id,
          roll: null,
          failuresAdded,
          isNatural20: false,
          successes: dies ? 0 : updated.deathSaveSuccesses,
          failures: dies ? 3 : failures,
        },
      ],
    };
  }

  if (preHp > 0 && updated.currentHitPoints <= 0) {
    return {
      combatant: {
        ...updated,
        downState: 'dying',
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
        activeConditions: [
          ...withoutUnconscious(updated.activeConditions),
          buildUnconsciousCondition(),
        ],
      },
      events: [{ kind: 'down', combatantId: updated.id, name: updated.name }],
    };
  }

  return { combatant: updated, events: [] };
};

/**
 * The death save a `dying` combatant rolls at the start of each of its own
 * turns (`runEncounter.ts`'s `takeTurn`, in place of its normal action) —
 * an unmodified d20, no ability modifier, no advantage/disadvantage from
 * conditions (death saves are a flat roll by the core 5e rule; no imported
 * creature/spell data in this schema currently grants advantage/
 * disadvantage on them specifically — a rare monster trait some stat blocks
 * have as unstructured prose this engine has no column to read from, real
 * follow-up work rather than an oversight). 10+ succeeds, a natural 1
 * counts as two failures, a natural 20 immediately restores 1 HP and full
 * consciousness. Three accumulated successes stabilizes (stops rolling,
 * stays unconscious at 0 HP for the rest of the encounter — no in-combat
 * healing is modeled); three accumulated failures kills them, the same
 * terminal state a fresh massive-damage hit reaches. A no-op (no roll, no
 * events) for anyone not currently `dying` — `stable`, `dead`, and `none`
 * all skip this, matching 5e's own rule that a stabilized creature stops
 * making the roll.
 */
export const rollDeathSave = (
  rng: Rng,
  combatant: EngineCombatant,
): DeathSaveTransition => {
  if (combatant.downState !== 'dying') return { combatant, events: [] };

  const roll = rollD20(rng);
  const outcome = classifyDeathSaveRoll(roll);

  if (outcome === 'nat20') {
    return {
      combatant: {
        ...combatant,
        downState: 'none',
        currentHitPoints: 1,
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
        activeConditions: withoutUnconscious(combatant.activeConditions),
      },
      events: [
        {
          kind: 'death-save',
          combatantId: combatant.id,
          roll,
          failuresAdded: 0,
          isNatural20: true,
          successes: combatant.deathSaveSuccesses,
          failures: combatant.deathSaveFailures,
        },
        { kind: 'revived', combatantId: combatant.id, hitPoints: 1 },
      ],
    };
  }

  if (outcome === 'success') {
    const successes = combatant.deathSaveSuccesses + 1;
    if (successes >= 3) {
      return {
        combatant: {
          ...combatant,
          downState: 'stable',
          deathSaveSuccesses: 0,
          deathSaveFailures: 0,
        },
        events: [
          {
            kind: 'death-save',
            combatantId: combatant.id,
            roll,
            failuresAdded: 0,
            isNatural20: false,
            successes: 3,
            failures: combatant.deathSaveFailures,
          },
          { kind: 'stabilized', combatantId: combatant.id },
        ],
      };
    }

    return {
      combatant: { ...combatant, deathSaveSuccesses: successes },
      events: [
        {
          kind: 'death-save',
          combatantId: combatant.id,
          roll,
          failuresAdded: 0,
          isNatural20: false,
          successes,
          failures: combatant.deathSaveFailures,
        },
      ],
    };
  }

  const failuresAdded: 1 | 2 = outcome === 'nat1' ? 2 : 1;
  const failures = combatant.deathSaveFailures + failuresAdded;

  if (failures >= 3) {
    return {
      combatant: {
        ...combatant,
        downState: 'dead',
        deathSaveSuccesses: 0,
        deathSaveFailures: 0,
        activeConditions: withoutUnconscious(combatant.activeConditions),
      },
      events: [
        {
          kind: 'death-save',
          combatantId: combatant.id,
          roll,
          failuresAdded,
          isNatural20: false,
          successes: combatant.deathSaveSuccesses,
          failures: 3,
        },
      ],
    };
  }

  return {
    combatant: { ...combatant, deathSaveFailures: failures },
    events: [
      {
        kind: 'death-save',
        combatantId: combatant.id,
        roll,
        failuresAdded,
        isNatural20: false,
        successes: combatant.deathSaveSuccesses,
        failures,
      },
    ],
  };
};
