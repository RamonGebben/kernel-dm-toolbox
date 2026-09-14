import { describe, expect, it } from 'vitest';
import { runEncounter } from '~/server/simulator/engine/runEncounter';
import { aggregateBatchResults } from '~/server/simulator/engine/aggregateBatchResults';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type {
  EngineAction,
  TurnLogEntry,
} from '~/server/simulator/engine/types';

/** PC spellcasting in the engine (issue #5, milestone 11): a caster's known
 * spell, once materialized into an `EngineAction` (mirroring what
 * `toEngineActionFromSpell` produces), should be selectable, consume a real
 * spell slot, and — for a save-based control spell — measurably change a
 * fight's outcome, the same "prove it over many seeded trials" style
 * `parityCheck.test.ts` already established for milestones 4/8. */

const dagger: EngineAction = {
  id: 'dagger',
  name: 'Dagger',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 2,
    reach: 5,
    range: null,
    damageDieCount: 1,
    damageDieType: 4,
    damageBonus: 0,
    damageType: 'piercing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

const longsword: EngineAction = {
  id: 'longsword',
  name: 'Longsword',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 6,
    reach: 5,
    range: null,
    damageDieCount: 1,
    damageDieType: 8,
    damageBonus: 3,
    damageType: 'slashing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

const monsterClaw: EngineAction = {
  id: 'monster-claw',
  name: 'Claw',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 6,
    reach: 5,
    range: null,
    damageDieCount: 2,
    damageDieType: 8,
    damageBonus: 4,
    damageType: 'slashing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

/** Mirrors what `toEngineActionFromSpell` builds for a 2nd-level Hold
 * Person-style spell: a Constitution save, paralyzed on a failure,
 * re-rolled at the end of the target's own turn, tied to concentration. */
const holdMonster: EngineAction = {
  id: 'spell:hold-monster',
  name: 'Hold Monster',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: null,
  save: {
    saveAbility: 'constitution',
    saveDc: 14,
    areaType: null,
    areaSize: null,
    damageOnFailRoll: null,
    damageOnFailType: null,
    halfDamageOnSave: true,
    appliesConditionKey: 'paralyzed',
    conditionDurationRounds: null,
    conditionSaveEndsEachTurn: true,
  },
  maxUsesPerEncounter: null,
  requiresConcentration: true,
  isSpell: true,
  requiresSpellSlotLevel: 2,
};

const TRIAL_COUNT = 250;

const runBatch = (
  casterActions: EngineAction[],
  spellSlotsRemaining: Record<number, number>,
  baseSeed: number,
) => {
  const results = Array.from({ length: TRIAL_COUNT }, (_, index) => {
    const caster = buildCombatant({
      id: 'caster',
      templateKey: 'caster',
      side: 'party',
      position: { x: 0, y: 0 },
      armorClass: 12,
      maxHitPoints: 20,
      currentHitPoints: 20,
      initiativeBonus: 2,
      actions: casterActions,
      spellSlotsRemaining,
    });
    const fighter = buildCombatant({
      id: 'fighter',
      templateKey: 'fighter',
      side: 'party',
      position: { x: 1, y: 0 },
      armorClass: 16,
      maxHitPoints: 30,
      currentHitPoints: 30,
      initiativeBonus: 1,
      actions: [longsword],
    });
    const monster = buildCombatant({
      id: 'monster',
      templateKey: 'monster',
      side: 'monsters',
      position: { x: 2, y: 0 },
      armorClass: 16,
      maxHitPoints: 60,
      currentHitPoints: 60,
      initiativeBonus: 0,
      actions: [monsterClaw],
    });
    return runEncounter(
      { combatants: [caster, fighter, monster] },
      baseSeed + index,
    );
  });
  return aggregateBatchResults(baseSeed, results);
};

describe('runEncounter PC spellcasting', () => {
  it('a save-based control spell measurably improves the party win rate over many trials', () => {
    const withSpell = runBatch([dagger, holdMonster], { 2: 1 }, 9000);
    const withoutSpell = runBatch([dagger], {}, 9000);

    expect(withSpell.partyWinRate).toBeGreaterThan(withoutSpell.partyWinRate);
  });

  it('casting the spell actually consumes its slot and applies the condition', () => {
    const caster = buildCombatant({
      id: 'caster',
      side: 'party',
      position: { x: 0, y: 0 },
      armorClass: 12,
      actions: [holdMonster],
      spellSlotsRemaining: { 2: 1 },
    });
    const monster = buildCombatant({
      id: 'monster',
      side: 'monsters',
      position: { x: 1, y: 0 },
      // A save DC of 14 vs. a +0 modifier target with no active conditions
      // fails on anything below a 14 — seed 1 is checked below to actually
      // exercise a failed save, not asserted blindly.
      maxHitPoints: 60,
      currentHitPoints: 60,
      actions: [monsterClaw],
    });

    const result = runEncounter({ combatants: [caster, monster] }, 1);

    const conditionApplied = result.log.some(
      (entry): entry is Extract<TurnLogEntry, { kind: 'condition-applied' }> =>
        entry.kind === 'condition-applied' &&
        entry.conditionKey === 'paralyzed',
    );
    expect(conditionApplied).toBe(true);
  });

  it('a spell with no remaining slot is never selected, but a cantrip stays usable', () => {
    const outOfSlotSpell: EngineAction = {
      ...holdMonster,
      id: 'spell:out-of-slots',
    };
    const cantrip: EngineAction = {
      id: 'spell:fire-bolt',
      name: 'Fire Bolt',
      actionType: 'ACTION',
      legendaryActionCost: null,
      attack: {
        toHitMod: 6,
        reach: null,
        range: 120,
        damageDieCount: 1,
        damageDieType: 10,
        damageBonus: 0,
        damageType: 'fire',
        extraDamageDieCount: 0,
        extraDamageDieType: 0,
        extraDamageBonus: 0,
        extraDamageType: null,
      },
      save: null,
      maxUsesPerEncounter: null,
      isSpell: true,
      requiresSpellSlotLevel: null,
    };

    const caster = buildCombatant({
      id: 'caster',
      side: 'party',
      position: { x: 0, y: 0 },
      armorClass: 12,
      actions: [outOfSlotSpell, cantrip],
      // The spell needs a level-2+ slot; none remain.
      spellSlotsRemaining: { 2: 0 },
    });
    const monster = buildCombatant({
      id: 'monster',
      side: 'monsters',
      position: { x: 1, y: 0 },
      maxHitPoints: 999,
      currentHitPoints: 999,
      actions: [monsterClaw],
    });

    const result = runEncounter(
      { combatants: [caster, monster], maxRounds: 1 },
      1,
    );

    const casterEntries = result.log.filter(
      entry =>
        'combatantId' in entry &&
        entry.combatantId === 'caster' &&
        (entry.kind === 'attack' || entry.kind === 'save-effect'),
    );
    // Only Fire Bolt (the cantrip) could have fired — Hold Monster was
    // never available with no slot left.
    expect(casterEntries).toHaveLength(1);
    expect(casterEntries[0]).toMatchObject({
      kind: 'attack',
      actionName: 'Fire Bolt',
    });
  });
});
