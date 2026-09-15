import { describe, expect, it } from 'vitest';
import { runEncounter } from '~/server/simulator/engine/runEncounter';
import { aggregateBatchResults } from '~/server/simulator/engine/aggregateBatchResults';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type { EngineAction } from '~/server/simulator/engine/types';

/**
 * Issue #5, milestone 13: a real end-to-end confidence check that the whole
 * second wave (conditions, concentration, PC spellcasting, monster
 * multiattack, death saves) works together in one fight, not just each
 * mechanic in isolation the way milestones 9-12's own tests already proved.
 * A spellcasting PC with a save-based control spell and a cantrip, a squishy
 * PC likely to be knocked down and either stabilize or die, and a multiattack
 * monster, run through `aggregateBatchResults` across many seeded trials —
 * regression coverage for the combination, sanity-checked directionally
 * (nothing 0%/100% that obviously shouldn't be, no crash, no combatant-count
 * mismatch), not a strict single-number assertion.
 */

const dagger: EngineAction = {
  id: 'dagger',
  name: 'Dagger',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 4,
    reach: 5,
    range: null,
    damageDieCount: 1,
    damageDieType: 4,
    damageBonus: 2,
    damageType: 'piercing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

/**
 * A cantrip — no slot required. Deliberately a melee-touch spell (reach
 * only, no range), not a ranged one like Fire Bolt: `selectAction` always
 * prefers any in-range attack action over a single-target (non-AoE) save
 * action (see its own doc comment — the AI has no "a good debuff beats chip
 * damage" heuristic, only an AoE-catches-2+ preference). A ranged cantrip
 * would be in range from turn one and would permanently crowd out Hold
 * Monster below, defeating the point of this test. A melee-only cantrip
 * keeps the save spell reachable while the caster is still closing
 * distance, exactly like `runEncounter.spellcasting.test.ts`'s own fixture
 * — this is real, existing engine behavior being worked around, not a bug
 * introduced by this test.
 */
const shockingGrasp: EngineAction = {
  id: 'spell:shocking-grasp',
  name: 'Shocking Grasp',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 5,
    reach: 5,
    range: null,
    damageDieCount: 1,
    damageDieType: 8,
    damageBonus: 0,
    damageType: 'lightning',
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

/** A save-based control spell — mirrors what `toEngineActionFromSpell`
 * produces for a real Hold Person/Monster-style spell. */
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

const monsterBite: EngineAction = {
  id: 'monster-bite',
  name: 'Bite',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 6,
    reach: 5,
    range: null,
    damageDieCount: 1,
    damageDieType: 8,
    damageBonus: 4,
    damageType: 'piercing',
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
    damageDieCount: 1,
    damageDieType: 6,
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

const TRIAL_COUNT = 300;

const buildScenario = () => ({
  combatants: [
    buildCombatant({
      id: 'caster',
      templateKey: 'caster',
      name: 'Caster',
      side: 'party' as const,
      position: { x: 0, y: 0 },
      armorClass: 12,
      maxHitPoints: 18,
      currentHitPoints: 18,
      initiativeBonus: 2,
      actions: [shockingGrasp, holdMonster],
      spellSlotsRemaining: { 2: 1 },
      tracksDeathSaves: true,
    }),
    buildCombatant({
      id: 'squishy',
      templateKey: 'squishy',
      name: 'Squishy',
      side: 'party' as const,
      position: { x: 1, y: 0 },
      armorClass: 11,
      maxHitPoints: 9,
      currentHitPoints: 9,
      initiativeBonus: 0,
      actions: [dagger],
      tracksDeathSaves: true,
    }),
    buildCombatant({
      id: 'brute',
      templateKey: 'brute',
      name: 'Ogre',
      side: 'monsters' as const,
      position: { x: 4, y: 0 },
      armorClass: 14,
      maxHitPoints: 45,
      currentHitPoints: 45,
      initiativeBonus: 0,
      actions: [monsterBite, monsterClaw],
      multiattackSequence: [
        { actionId: 'monster-bite', count: 1 },
        { actionId: 'monster-claw', count: 1 },
      ],
    }),
  ],
});

describe('combined feature parity (conditions, concentration, spellcasting, multiattack, death saves)', () => {
  it('runs the whole combination across many trials with directionally sane, non-degenerate stats', () => {
    const results = Array.from({ length: TRIAL_COUNT }, (_, index) =>
      runEncounter(buildScenario(), 42_000 + index),
    );

    const summary = aggregateBatchResults(42_000, results);

    expect(summary.trialCount).toBe(TRIAL_COUNT);
    // A genuinely contested fight — neither side should be winning (or
    // losing) every single trial. Wide bounds on purpose: this is a
    // regression/sanity net for the combination working at all, not a
    // balance assertion on these exact statlines.
    expect(summary.partyWinRate).toBeGreaterThan(0);
    expect(summary.partyWinRate).toBeLessThan(1);
    expect(
      summary.partyWinRate + summary.monsterWinRate + summary.drawRate,
    ).toBeCloseTo(1);

    expect(summary.combatants).toHaveLength(3);
    const byKey = new Map(summary.combatants.map(c => [c.templateKey, c]));
    const squishy = byKey.get('squishy');
    const caster = byKey.get('caster');
    const brute = byKey.get('brute');
    expect(squishy).toBeDefined();
    expect(caster).toBeDefined();
    expect(brute).toBeDefined();

    // The fragile PC should actually be knocked down in at least some
    // trials — proves `down` events are firing for real inside a fight that
    // also has spellcasting/conditions/multiattack going on around it, not
    // just in death-saves' own isolated fixture.
    expect(squishy!.wentDownRate).toBeGreaterThan(0);
    // Both PC survival outcomes should occur across enough trials: some
    // die, some don't (whether by never going down or by stabilizing/
    // reviving) — a real behavioral spread, not every trial landing the
    // same way.
    expect(squishy!.survivalRate).toBeGreaterThan(0);
    expect(squishy!.survivalRate).toBeLessThan(1);

    // The multiattack monster should be dealing damage via both of its
    // named sub-attacks, not silently falling back to a single flat
    // attack — a real regression check that `multiattackSequence` isn't
    // getting dropped somewhere in this more complex combined scenario.
    const attackNamesUsed = new Set(
      results.flatMap(result =>
        result.log
          .filter(
            (entry): entry is Extract<typeof entry, { kind: 'attack' }> =>
              entry.kind === 'attack' && entry.combatantId === 'brute',
          )
          .map(entry => entry.actionName),
      ),
    );
    expect(attackNamesUsed.has('Bite')).toBe(true);
    expect(attackNamesUsed.has('Claw')).toBe(true);

    // At least some trials should see the control spell land a condition —
    // proves conditions/concentration are actually exercised in this
    // combined scenario, not just possible in isolation.
    const anyConditionApplied = results.some(result =>
      result.log.some(entry => entry.kind === 'condition-applied'),
    );
    expect(anyConditionApplied).toBe(true);

    expect(brute!.averageDamageDealt).toBeGreaterThan(0);
  });
});
