import { describe, expect, it } from 'vitest';
import {
  resolveAttack,
  resolveSaveAction,
} from '~/server/simulator/engine/resolveAction';
import type { Rng } from '~/server/simulator/engine/rng';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type {
  EngineActiveCondition,
  EngineAttack,
  EngineSaveEffect,
} from '~/server/simulator/engine/types';

const activeCondition = (
  conditionKey: string,
  overrides: Partial<EngineActiveCondition> = {},
): EngineActiveCondition => ({
  conditionKey,
  roundsRemaining: null,
  saveEndsEachTurn: false,
  saveAbility: null,
  saveDc: null,
  concentrationSourceId: null,
  ...overrides,
});

/** The exact `rng()` value that makes `rollDie(rng, sides)` return `roll` —
 * `floor(v * sides) === roll - 1` at the low edge of that roll's bucket. */
const valueForRoll = (roll: number, sides: number): number =>
  (roll - 1) / sides;

/** A fake `Rng` that replays a fixed sequence of pre-chosen die results
 * instead of a real seeded stream — makes attack/save resolution tests
 * assert exact outcomes instead of just "stays in range". */
const fakeRng = (values: number[]): Rng => {
  let index = 0;
  return () => {
    const value = values[index] ?? 0;
    index += 1;
    return value;
  };
};

const shortsword: EngineAttack = {
  toHitMod: 5,
  reach: 5,
  range: null,
  damageDieCount: 1,
  damageDieType: 6,
  damageBonus: 3,
  damageType: 'slashing',
  extraDamageDieCount: 0,
  extraDamageDieType: 0,
  extraDamageBonus: 0,
  extraDamageType: null,
};

describe('resolveAttack', () => {
  it('hits and rolls damage when the total meets AC', () => {
    const target = buildCombatant({ armorClass: 14, currentHitPoints: 20 });
    // d20 roll of 12 (+5 = 17, beats AC 14), damage die of 4 (+3 = 7)
    const rng = fakeRng([valueForRoll(12, 20), valueForRoll(4, 6)]);

    const { updatedTarget, logEntry } = resolveAttack(
      rng,
      { id: 'attacker-1', activeConditions: [] },
      'Shortsword',
      shortsword,
      target,
    );

    expect(logEntry).toMatchObject({
      kind: 'attack',
      hit: true,
      critical: false,
      attackRoll: 17,
      damage: 7,
    });
    expect(updatedTarget.currentHitPoints).toBe(13);
  });

  it('misses when the total is below AC', () => {
    const target = buildCombatant({ armorClass: 20, currentHitPoints: 20 });
    const rng = fakeRng([valueForRoll(5, 20)]);

    const { updatedTarget, logEntry } = resolveAttack(
      rng,
      { id: 'attacker-1', activeConditions: [] },
      'Shortsword',
      shortsword,
      target,
    );

    expect(logEntry).toMatchObject({ hit: false, damage: 0 });
    expect(updatedTarget.currentHitPoints).toBe(20);
  });

  it('always hits and doubles damage dice on a natural 20', () => {
    const target = buildCombatant({ armorClass: 99, currentHitPoints: 20 });
    // nat 20, then two damage dice (doubled) of 6 and 6
    const rng = fakeRng([
      valueForRoll(20, 20),
      valueForRoll(6, 6),
      valueForRoll(6, 6),
    ]);

    const { updatedTarget, logEntry } = resolveAttack(
      rng,
      { id: 'attacker-1', activeConditions: [] },
      'Shortsword',
      shortsword,
      target,
    );

    expect(logEntry).toMatchObject({ hit: true, critical: true });
    // 6 + 6 + 3 (bonus applied once) = 15
    expect(logEntry.kind === 'attack' && logEntry.damage).toBe(15);
    expect(updatedTarget.currentHitPoints).toBe(5);
  });

  it('always misses on a natural 1 even against AC 0', () => {
    const target = buildCombatant({ armorClass: 0, currentHitPoints: 20 });
    const rng = fakeRng([valueForRoll(1, 20)]);

    const { logEntry } = resolveAttack(
      rng,
      { id: 'attacker-1', activeConditions: [] },
      'Shortsword',
      shortsword,
      target,
    );

    expect(logEntry).toMatchObject({ hit: false });
  });
});

const breath: EngineSaveEffect = {
  saveAbility: 'dexterity',
  saveDc: 15,
  areaType: 'line',
  areaSize: 30,
  damageOnFailRoll: '2d6',
  damageOnFailType: 'acid',
  halfDamageOnSave: true,
};

describe('resolveSaveAction', () => {
  it('deals full rolled damage to a target that fails its save', () => {
    const target = buildCombatant({ currentHitPoints: 20 });
    // save roll of 5 (fails DC 15), damage dice 4 + 4
    const rng = fakeRng([
      valueForRoll(5, 20),
      valueForRoll(4, 6),
      valueForRoll(4, 6),
    ]);

    const { updatedTargets, logEntry } = resolveSaveAction(
      rng,
      'attacker-1',
      'Acid Breath',
      breath,
      [target],
    );

    expect(logEntry).toMatchObject({
      kind: 'save-effect',
      targets: [{ succeeded: false, damage: 8 }],
    });
    expect(updatedTargets[0]?.currentHitPoints).toBe(12);
  });

  it('halves damage for a target that succeeds its save', () => {
    const target = buildCombatant({ currentHitPoints: 20 });
    // save roll of 18 (succeeds DC 15), damage dice 4 + 4 -> halved to 4
    const rng = fakeRng([
      valueForRoll(18, 20),
      valueForRoll(4, 6),
      valueForRoll(4, 6),
    ]);

    const { updatedTargets, logEntry } = resolveSaveAction(
      rng,
      'attacker-1',
      'Acid Breath',
      breath,
      [target],
    );

    expect(logEntry).toMatchObject({
      targets: [{ succeeded: true, damage: 4 }],
    });
    expect(updatedTargets[0]?.currentHitPoints).toBe(16);
  });

  it('deals no damage on a success when halfDamageOnSave is false', () => {
    const target = buildCombatant({ currentHitPoints: 20 });
    const rng = fakeRng([
      valueForRoll(18, 20),
      valueForRoll(4, 6),
      valueForRoll(4, 6),
    ]);

    const { updatedTargets } = resolveSaveAction(
      rng,
      'attacker-1',
      'Acid Breath',
      { ...breath, halfDamageOnSave: false },
      [target],
    );

    expect(updatedTargets[0]?.currentHitPoints).toBe(20);
  });

  it('rolls each affected target independently for an AoE', () => {
    const a = buildCombatant({ id: 'a', currentHitPoints: 20 });
    const b = buildCombatant({ id: 'b', currentHitPoints: 20 });
    // a fails (roll 5), b succeeds (roll 18); damage dice shared roll order
    const rng = fakeRng([
      valueForRoll(5, 20),
      valueForRoll(3, 6),
      valueForRoll(3, 6),
      valueForRoll(18, 20),
      valueForRoll(3, 6),
      valueForRoll(3, 6),
    ]);

    const { updatedTargets } = resolveSaveAction(
      rng,
      'attacker-1',
      'Acid Breath',
      breath,
      [a, b],
    );

    expect(updatedTargets[0]?.currentHitPoints).toBe(14);
    expect(updatedTargets[1]?.currentHitPoints).toBe(17);
  });

  it('overrides a failed save by spending a Legendary Resistance use', () => {
    const target = buildCombatant({
      currentHitPoints: 20,
      legendaryResistancesRemaining: 3,
    });
    // roll of 5 would fail DC 15, but Legendary Resistance turns it into a
    // success and halves the rolled damage instead
    const rng = fakeRng([
      valueForRoll(5, 20),
      valueForRoll(4, 6),
      valueForRoll(4, 6),
    ]);

    const { updatedTargets, logEntry } = resolveSaveAction(
      rng,
      'attacker-1',
      'Acid Breath',
      breath,
      [target],
    );

    expect(logEntry).toMatchObject({
      targets: [{ succeeded: true, usedLegendaryResistance: true, damage: 4 }],
    });
    expect(updatedTargets[0]?.currentHitPoints).toBe(16);
    expect(updatedTargets[0]?.legendaryResistancesRemaining).toBe(2);
  });

  it('applies a saving-throw ability modifier from the target', () => {
    const target = buildCombatant({
      currentHitPoints: 20,
      saveModifiers: {
        strength: 0,
        dexterity: 10,
        constitution: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0,
      },
    });
    // raw roll of 5 + modifier 10 = 15, meets DC 15 -> succeeds
    const rng = fakeRng([
      valueForRoll(5, 20),
      valueForRoll(4, 6),
      valueForRoll(4, 6),
    ]);

    const { logEntry } = resolveSaveAction(
      rng,
      'attacker-1',
      'Acid Breath',
      breath,
      [target],
    );

    expect(logEntry).toMatchObject({ targets: [{ succeeded: true }] });
  });
});

describe('resolveAttack — conditions', () => {
  it('rolls with disadvantage when the attacker is blinded', () => {
    const attacker = {
      id: 'attacker-1',
      activeConditions: [activeCondition('blinded')],
    };
    const target = buildCombatant({ armorClass: 15, currentHitPoints: 20 });
    // rolls 15 (would hit AC 15) then 3 (would miss) — disadvantage keeps
    // the lower, so this should miss
    const rng = fakeRng([valueForRoll(15, 20), valueForRoll(3, 20)]);

    const { logEntry } = resolveAttack(rng, attacker, 'Claw', shortsword, target);

    expect(logEntry).toMatchObject({ hit: false, attackRoll: 3 + 5 });
  });

  it('rolls with advantage against a paralyzed target', () => {
    const attacker = { id: 'attacker-1', activeConditions: [] };
    const target = buildCombatant({
      armorClass: 25,
      currentHitPoints: 20,
      activeConditions: [activeCondition('paralyzed')],
    });
    // rolls 3 then 15 — advantage keeps the higher, 15 (+5 = 20, beats AC
    // 19). Paralyzed also forces a melee crit on any hit, doubling the two
    // damage-die rolls that follow.
    const rng = fakeRng([
      valueForRoll(3, 20),
      valueForRoll(15, 20),
      valueForRoll(4, 6),
      valueForRoll(4, 6),
    ]);

    const { logEntry } = resolveAttack(
      rng,
      attacker,
      'Dagger',
      { ...shortsword, toHitMod: 5 },
      { ...target, armorClass: 19 },
    );

    expect(logEntry).toMatchObject({ hit: true, attackRoll: 20, critical: true });
  });

  it('cancels advantage and disadvantage from different sources back to normal', () => {
    // blinded attacker (disadvantage on its own attacks) vs. a paralyzed
    // target (advantage against it) should cancel to a normal, single roll.
    const attacker = {
      id: 'attacker-1',
      activeConditions: [activeCondition('blinded')],
    };
    const target = buildCombatant({
      armorClass: 15,
      currentHitPoints: 20,
      activeConditions: [activeCondition('paralyzed')],
    });
    const rng = fakeRng([valueForRoll(10, 20)]);

    const { logEntry } = resolveAttack(rng, attacker, 'Claw', shortsword, target);

    // Normal mode consumes exactly one roll — attackRoll reflects roll 10 + mod 5
    expect(logEntry).toMatchObject({ attackRoll: 15 });
  });

  it('upgrades a melee hit against a paralyzed target to a critical, without forcing a hit', () => {
    const attacker = { id: 'attacker-1', activeConditions: [] };
    const paralyzedTarget = buildCombatant({
      armorClass: 12,
      currentHitPoints: 20,
      activeConditions: [activeCondition('paralyzed')],
    });
    // roll of 15 (not a natural 20) still beats AC 12 -> hits, and should
    // be upgraded to a critical because the target is paralyzed and the
    // attack is melee
    const rng = fakeRng([
      valueForRoll(15, 20),
      valueForRoll(15, 20), // advantage's second roll (paralyzed grants advantage-against)
      valueForRoll(4, 6),
      valueForRoll(4, 6),
    ]);

    const { logEntry } = resolveAttack(
      rng,
      attacker,
      'Claw',
      shortsword,
      paralyzedTarget,
    );

    expect(logEntry).toMatchObject({ hit: true, critical: true });
  });

  it('does not force a critical when the attack misses a paralyzed target', () => {
    const attacker = { id: 'attacker-1', activeConditions: [] };
    const paralyzedTarget = buildCombatant({
      armorClass: 30,
      currentHitPoints: 20,
      activeConditions: [activeCondition('paralyzed')],
    });
    const rng = fakeRng([valueForRoll(2, 20), valueForRoll(3, 20)]);

    const { logEntry } = resolveAttack(
      rng,
      attacker,
      'Claw',
      shortsword,
      paralyzedTarget,
    );

    expect(logEntry).toMatchObject({ hit: false, critical: false });
  });

  it('halves damage against a petrified target regardless of its own resistance list', () => {
    const attacker = { id: 'attacker-1', activeConditions: [] };
    const petrifiedTarget = buildCombatant({
      armorClass: 5,
      currentHitPoints: 20,
      activeConditions: [activeCondition('petrified')],
    });
    // petrified is part of the "helpless" bundle, so attacks against it also
    // roll with advantage (two d20s) before the damage die of 4 (+3 = 7),
    // halved by resist-all to 3
    const rng = fakeRng([
      valueForRoll(10, 20),
      valueForRoll(10, 20),
      valueForRoll(4, 6),
    ]);

    const { logEntry } = resolveAttack(
      rng,
      attacker,
      'Claw',
      shortsword,
      petrifiedTarget,
    );

    expect(logEntry.kind === 'attack' && logEntry.damage).toBe(3);
  });
});

describe('resolveSaveAction — conditions', () => {
  it('automatically fails a save for an ability the target auto-fails, ignoring the roll', () => {
    const target = buildCombatant({
      currentHitPoints: 20,
      activeConditions: [activeCondition('paralyzed')], // auto-fails STR/DEX
    });
    // a natural 20 on the save roll would normally succeed against any DC
    const rng = fakeRng([
      valueForRoll(20, 20),
      valueForRoll(4, 6),
      valueForRoll(4, 6),
    ]);

    const { logEntry } = resolveSaveAction(
      rng,
      'attacker-1',
      'Acid Breath',
      breath,
      [target],
    );

    expect(logEntry).toMatchObject({ targets: [{ succeeded: false }] });
  });

  it('rolls a Dexterity save with disadvantage for a restrained target', () => {
    const target = buildCombatant({
      currentHitPoints: 20,
      activeConditions: [activeCondition('restrained')],
    });
    // 18 would succeed DC 15, but disadvantage keeps the lower roll of 5,
    // which fails
    const rng = fakeRng([
      valueForRoll(18, 20),
      valueForRoll(5, 20),
      valueForRoll(4, 6),
      valueForRoll(4, 6),
    ]);

    const { logEntry } = resolveSaveAction(
      rng,
      'attacker-1',
      'Acid Breath',
      breath,
      [target],
    );

    expect(logEntry).toMatchObject({ targets: [{ succeeded: false, saveRoll: 5 }] });
  });

  it('applies the configured condition to a target that fails the save', () => {
    const target = buildCombatant({ currentHitPoints: 20 });
    const holdPerson: EngineSaveEffect = {
      saveAbility: 'wisdom',
      saveDc: 14,
      areaType: null,
      areaSize: null,
      damageOnFailRoll: null,
      damageOnFailType: null,
      halfDamageOnSave: true,
      appliesConditionKey: 'paralyzed',
      conditionDurationRounds: null,
      conditionSaveEndsEachTurn: true,
    };
    const rng = fakeRng([valueForRoll(5, 20)]);

    const { updatedTargets, conditionEvents } = resolveSaveAction(
      rng,
      'caster-1',
      'Hold Person',
      holdPerson,
      [target],
    );

    expect(updatedTargets[0]?.activeConditions).toEqual([
      {
        conditionKey: 'paralyzed',
        roundsRemaining: null,
        saveEndsEachTurn: true,
        saveAbility: 'wisdom',
        saveDc: 14,
        concentrationSourceId: null,
      },
    ]);
    expect(conditionEvents).toEqual([
      {
        kind: 'condition-applied',
        combatantId: target.id,
        conditionKey: 'paralyzed',
        sourceCombatantId: 'caster-1',
        roundsRemaining: null,
        saveEndsEachTurn: true,
      },
    ]);
  });

  it('does not apply a condition to a target that succeeds the save', () => {
    const target = buildCombatant({ currentHitPoints: 20 });
    const holdPerson: EngineSaveEffect = {
      saveAbility: 'wisdom',
      saveDc: 14,
      areaType: null,
      areaSize: null,
      damageOnFailRoll: null,
      damageOnFailType: null,
      halfDamageOnSave: true,
      appliesConditionKey: 'paralyzed',
      conditionDurationRounds: null,
      conditionSaveEndsEachTurn: true,
    };
    const rng = fakeRng([valueForRoll(18, 20)]);

    const { updatedTargets, conditionEvents } = resolveSaveAction(
      rng,
      'caster-1',
      'Hold Person',
      holdPerson,
      [target],
    );

    expect(updatedTargets[0]?.activeConditions).toEqual([]);
    expect(conditionEvents).toEqual([]);
  });

  it('tags a newly applied condition with the concentration source when requiresConcentration is true', () => {
    const target = buildCombatant({ currentHitPoints: 20 });
    const holdPerson: EngineSaveEffect = {
      saveAbility: 'wisdom',
      saveDc: 14,
      areaType: null,
      areaSize: null,
      damageOnFailRoll: null,
      damageOnFailType: null,
      halfDamageOnSave: true,
      appliesConditionKey: 'paralyzed',
      conditionDurationRounds: null,
      conditionSaveEndsEachTurn: true,
    };
    const rng = fakeRng([valueForRoll(5, 20)]);

    const { updatedTargets } = resolveSaveAction(
      rng,
      'caster-1',
      'Hold Person',
      holdPerson,
      [target],
      true,
    );

    expect(updatedTargets[0]?.activeConditions[0]?.concentrationSourceId).toBe(
      'caster-1',
    );
  });
});
