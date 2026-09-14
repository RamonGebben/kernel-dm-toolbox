import { describe, expect, it } from 'vitest';
import {
  resolveAttack,
  resolveSaveAction,
} from '~/server/simulator/engine/resolveAction';
import type { Rng } from '~/server/simulator/engine/rng';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type {
  EngineAttack,
  EngineSaveEffect,
} from '~/server/simulator/engine/types';

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
      'attacker-1',
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
      'attacker-1',
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
      'attacker-1',
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
      'attacker-1',
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
