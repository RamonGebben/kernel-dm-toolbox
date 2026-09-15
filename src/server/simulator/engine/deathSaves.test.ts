import { describe, expect, it } from 'vitest';
import {
  applyDamageForDeathSaves,
  classifyDeathSaveRoll,
  isMassiveDamageDeath,
  rollDeathSave,
} from '~/server/simulator/engine/deathSaves';
import type { Rng } from '~/server/simulator/engine/rng';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';

/** The exact `rng()` value that makes `rollDie(rng, sides)` return `roll` —
 * matches `resolveAction.test.ts`'s own helper. */
const valueForRoll = (roll: number, sides: number): number =>
  (roll - 1) / sides;

const fakeRng = (values: number[]): Rng => {
  let index = 0;
  return () => {
    const value = values[index] ?? 0;
    index += 1;
    return value;
  };
};

describe('classifyDeathSaveRoll', () => {
  it('classifies a natural 20 as nat20', () => {
    expect(classifyDeathSaveRoll(20)).toBe('nat20');
  });

  it('classifies a natural 1 as nat1', () => {
    expect(classifyDeathSaveRoll(1)).toBe('nat1');
  });

  it('classifies 10 and above (other than 20) as success', () => {
    expect(classifyDeathSaveRoll(10)).toBe('success');
    expect(classifyDeathSaveRoll(19)).toBe('success');
  });

  it('classifies 2-9 as failure', () => {
    expect(classifyDeathSaveRoll(2)).toBe('failure');
    expect(classifyDeathSaveRoll(9)).toBe('failure');
  });
});

describe('isMassiveDamageDeath', () => {
  it('is false when the hit does not even reach 0 HP', () => {
    expect(isMassiveDamageDeath(15, 10, 20)).toBe(false);
  });

  it('is false when overkill is below max HP', () => {
    // preHp 5, damage 20 -> overkill 15, maxHp 20: not enough
    expect(isMassiveDamageDeath(5, 20, 20)).toBe(false);
  });

  it('is true when overkill equals or exceeds max HP on a fresh drop to 0', () => {
    // preHp 5, damage 30 -> overkill 25 >= maxHp 20
    expect(isMassiveDamageDeath(5, 30, 20)).toBe(true);
    // exactly equal counts too
    expect(isMassiveDamageDeath(5, 25, 20)).toBe(true);
  });

  it('is true for a large hit against an already-down combatant (preHp 0)', () => {
    expect(isMassiveDamageDeath(0, 25, 20)).toBe(true);
  });

  it('is false for a small hit against an already-down combatant', () => {
    expect(isMassiveDamageDeath(0, 15, 20)).toBe(false);
  });
});

describe('applyDamageForDeathSaves', () => {
  const eligible = buildCombatant({
    tracksDeathSaves: true,
    maxHitPoints: 20,
  });

  it('is a no-op for a combatant that does not track death saves', () => {
    const previous = buildCombatant({
      tracksDeathSaves: false,
      currentHitPoints: 10,
    });
    const updated = { ...previous, currentHitPoints: 0 };
    const result = applyDamageForDeathSaves(previous, updated, 10, false);
    expect(result.combatant).toBe(updated);
    expect(result.events).toEqual([]);
  });

  it('is a no-op for zero damage', () => {
    const previous = { ...eligible, currentHitPoints: 10 };
    const result = applyDamageForDeathSaves(previous, previous, 0, false);
    expect(result.events).toEqual([]);
  });

  it('is a no-op for a combatant already dead', () => {
    const previous = {
      ...eligible,
      downState: 'dead' as const,
      currentHitPoints: 0,
    };
    const result = applyDamageForDeathSaves(previous, previous, 10, false);
    expect(result.combatant.downState).toBe('dead');
    expect(result.events).toEqual([]);
  });

  it('kills instantly on massive damage from a fresh hit', () => {
    const previous = {
      ...eligible,
      currentHitPoints: 5,
      downState: 'none' as const,
    };
    const updated = { ...previous, currentHitPoints: 0 };
    const result = applyDamageForDeathSaves(previous, updated, 30, false);
    expect(result.combatant.downState).toBe('dead');
    expect(result.combatant.deathSaveSuccesses).toBe(0);
    expect(result.combatant.deathSaveFailures).toBe(0);
    expect(result.events).toEqual([]);
  });

  it('kills instantly on massive damage against an already-down combatant', () => {
    const previous = {
      ...eligible,
      currentHitPoints: 0,
      downState: 'dying' as const,
      deathSaveSuccesses: 1,
      activeConditions: [
        {
          conditionKey: 'unconscious',
          roundsRemaining: null,
          saveEndsEachTurn: false,
          saveAbility: null,
          saveDc: null,
          concentrationSourceId: null,
        },
      ],
    };
    const updated = { ...previous, currentHitPoints: 0 };
    const result = applyDamageForDeathSaves(previous, updated, 25, false);
    expect(result.combatant.downState).toBe('dead');
    expect(result.combatant.activeConditions).toEqual([]);
  });

  it('enters the dying state on a fresh drop to 0 HP, with a down event', () => {
    const previous = {
      ...eligible,
      currentHitPoints: 8,
      downState: 'none' as const,
    };
    const updated = { ...previous, currentHitPoints: 0 };
    const result = applyDamageForDeathSaves(previous, updated, 8, false);

    expect(result.combatant.downState).toBe('dying');
    expect(result.combatant.deathSaveSuccesses).toBe(0);
    expect(result.combatant.deathSaveFailures).toBe(0);
    expect(
      result.combatant.activeConditions.some(
        c => c.conditionKey === 'unconscious',
      ),
    ).toBe(true);
    expect(result.events).toEqual([
      { kind: 'down', combatantId: updated.id, name: updated.name },
    ]);
  });

  it('adds one automatic failure when hit again while dying (non-critical)', () => {
    const previous = {
      ...eligible,
      currentHitPoints: 0,
      downState: 'dying' as const,
      deathSaveFailures: 1,
    };
    const updated = { ...previous, currentHitPoints: 0 };
    const result = applyDamageForDeathSaves(previous, updated, 5, false);

    expect(result.combatant.downState).toBe('dying');
    expect(result.combatant.deathSaveFailures).toBe(2);
    expect(result.events).toEqual([
      {
        kind: 'death-save',
        combatantId: updated.id,
        roll: null,
        failuresAdded: 1,
        isNatural20: false,
        successes: 0,
        failures: 2,
      },
    ]);
  });

  it('adds two automatic failures on a critical hit while dying', () => {
    const previous = {
      ...eligible,
      currentHitPoints: 0,
      downState: 'dying' as const,
      deathSaveFailures: 0,
    };
    const updated = { ...previous, currentHitPoints: 0 };
    const result = applyDamageForDeathSaves(previous, updated, 5, true);

    expect(result.combatant.deathSaveFailures).toBe(2);
    expect(result.events[0]).toMatchObject({ failuresAdded: 2 });
  });

  it('dies when automatic failures reach 3', () => {
    const previous = {
      ...eligible,
      currentHitPoints: 0,
      downState: 'dying' as const,
      deathSaveFailures: 2,
    };
    const updated = { ...previous, currentHitPoints: 0 };
    const result = applyDamageForDeathSaves(previous, updated, 5, false);

    expect(result.combatant.downState).toBe('dead');
    expect(result.combatant.deathSaveFailures).toBe(0);
    expect(result.events[0]).toMatchObject({ failures: 3 });
  });

  it('un-stabilizes a stable combatant that takes damage again', () => {
    const previous = {
      ...eligible,
      currentHitPoints: 0,
      downState: 'stable' as const,
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
    };
    const updated = { ...previous, currentHitPoints: 0 };
    const result = applyDamageForDeathSaves(previous, updated, 4, false);

    expect(result.combatant.downState).toBe('dying');
    expect(result.combatant.deathSaveFailures).toBe(1);
  });
});

describe('rollDeathSave', () => {
  const dying = buildCombatant({
    tracksDeathSaves: true,
    currentHitPoints: 0,
    downState: 'dying',
    activeConditions: [
      {
        conditionKey: 'unconscious',
        roundsRemaining: null,
        saveEndsEachTurn: false,
        saveAbility: null,
        saveDc: null,
        concentrationSourceId: null,
      },
    ],
  });

  it('is a no-op for a combatant not currently dying', () => {
    const stable = { ...dying, downState: 'stable' as const };
    const result = rollDeathSave(fakeRng([valueForRoll(15, 20)]), stable);
    expect(result.combatant).toBe(stable);
    expect(result.events).toEqual([]);
  });

  it('adds a success on a roll of 10-19', () => {
    const rng = fakeRng([valueForRoll(14, 20)]);
    const result = rollDeathSave(rng, dying);
    expect(result.combatant.deathSaveSuccesses).toBe(1);
    expect(result.combatant.downState).toBe('dying');
    expect(result.events).toEqual([
      {
        kind: 'death-save',
        combatantId: dying.id,
        roll: 14,
        failuresAdded: 0,
        isNatural20: false,
        successes: 1,
        failures: 0,
      },
    ]);
  });

  it('stabilizes on the 3rd success', () => {
    const twoSuccesses = { ...dying, deathSaveSuccesses: 2 };
    const rng = fakeRng([valueForRoll(12, 20)]);
    const result = rollDeathSave(rng, twoSuccesses);

    expect(result.combatant.downState).toBe('stable');
    expect(result.combatant.deathSaveSuccesses).toBe(0);
    expect(result.events.map(e => e.kind)).toEqual([
      'death-save',
      'stabilized',
    ]);
  });

  it('adds a failure on a roll of 2-9', () => {
    const rng = fakeRng([valueForRoll(6, 20)]);
    const result = rollDeathSave(rng, dying);
    expect(result.combatant.deathSaveFailures).toBe(1);
  });

  it('dies on the 3rd failure', () => {
    const twoFailures = { ...dying, deathSaveFailures: 2 };
    const rng = fakeRng([valueForRoll(4, 20)]);
    const result = rollDeathSave(rng, twoFailures);

    expect(result.combatant.downState).toBe('dead');
    expect(result.combatant.activeConditions).toEqual([]);
  });

  it('counts a natural 1 as two failures', () => {
    const rng = fakeRng([valueForRoll(1, 20)]);
    const result = rollDeathSave(rng, dying);
    expect(result.combatant.deathSaveFailures).toBe(2);
    expect(result.events[0]).toMatchObject({ failuresAdded: 2, roll: 1 });
  });

  it('revives on a natural 20, restoring 1 HP and removing unconscious', () => {
    const rng = fakeRng([valueForRoll(20, 20)]);
    const result = rollDeathSave(rng, dying);

    expect(result.combatant.downState).toBe('none');
    expect(result.combatant.currentHitPoints).toBe(1);
    expect(result.combatant.activeConditions).toEqual([]);
    expect(result.events).toEqual([
      {
        kind: 'death-save',
        combatantId: dying.id,
        roll: 20,
        failuresAdded: 0,
        isNatural20: true,
        successes: 0,
        failures: 0,
      },
      { kind: 'revived', combatantId: dying.id, hitPoints: 1 },
    ]);
  });
});
