import { describe, expect, it } from 'vitest';
import {
  CONDITION_EFFECTS,
  combineConditionEffects,
  conditionKeyFromSlug,
  resolveRollMode,
} from '~/server/simulator/engine/conditionEffects';
import type { EngineActiveCondition } from '~/server/simulator/engine/types';

const condition = (
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

describe('conditionKeyFromSlug', () => {
  it('recovers the short key from a versioned upstream slug', () => {
    expect(conditionKeyFromSlug('srd-2024_paralyzed')).toBe('paralyzed');
  });

  it('falls back to the whole value when there is no underscore', () => {
    expect(conditionKeyFromSlug('paralyzed')).toBe('paralyzed');
  });
});

describe('CONDITION_EFFECTS', () => {
  it('gives Paralyzed the full helpless bundle plus a forced melee crit', () => {
    expect(CONDITION_EFFECTS.paralyzed).toMatchObject({
      incapacitates: true,
      speedZero: true,
      advantageOnAttacksAgainst: true,
      meleeHitsAreCritical: true,
      autoFailSaveAbilities: ['strength', 'dexterity'],
    });
  });

  it('gives Petrified the helpless bundle plus resistance to all damage, but no forced crit', () => {
    expect(CONDITION_EFFECTS.petrified).toMatchObject({
      incapacitates: true,
      resistAllDamage: true,
      meleeHitsAreCritical: false,
    });
  });

  it("gives Prone asymmetric melee/ranged effects on attacks against it", () => {
    expect(CONDITION_EFFECTS.prone).toMatchObject({
      advantageOnMeleeAttacksAgainst: true,
      disadvantageOnRangedAttacksAgainst: true,
      advantageOnAttacksAgainst: false,
    });
  });

  it('gives Restrained disadvantage specifically on Dexterity saves, not every save', () => {
    expect(CONDITION_EFFECTS.restrained.disadvantageOnSaveAbilities).toEqual([
      'dexterity',
    ]);
  });

  it('treats Charmed, Deafened, and Exhaustion as documented no-ops', () => {
    expect(CONDITION_EFFECTS.charmed).toMatchObject({
      incapacitates: false,
      disadvantageOnOwnAttacks: false,
      advantageOnAttacksAgainst: false,
    });
    expect(CONDITION_EFFECTS.deafened).toMatchObject({
      incapacitates: false,
      disadvantageOnOwnAttacks: false,
    });
    expect(CONDITION_EFFECTS.exhaustion).toMatchObject({
      incapacitates: false,
      disadvantageOnOwnAttacks: false,
    });
  });
});

describe('combineConditionEffects', () => {
  it('returns every-false/empty for no active conditions', () => {
    expect(combineConditionEffects([])).toMatchObject({
      incapacitates: false,
      autoFailSaveAbilities: [],
    });
  });

  it('ORs boolean effects across multiple active conditions', () => {
    const effects = combineConditionEffects([
      condition('blinded'),
      condition('grappled'),
    ]);
    expect(effects.disadvantageOnOwnAttacks).toBe(true); // from blinded
    expect(effects.advantageOnAttacksAgainst).toBe(true); // from blinded
    expect(effects.speedZero).toBe(true); // from grappled
  });

  it('unions auto-fail/disadvantage save ability lists without duplicates', () => {
    const effects = combineConditionEffects([
      condition('paralyzed'),
      condition('restrained'),
    ]);
    expect(new Set(effects.autoFailSaveAbilities)).toEqual(
      new Set(['strength', 'dexterity']),
    );
    expect(effects.disadvantageOnSaveAbilities).toEqual(['dexterity']);
  });

  it('ignores an unknown condition key rather than throwing', () => {
    expect(() =>
      combineConditionEffects([condition('not-a-real-condition')]),
    ).not.toThrow();
  });
});

describe('resolveRollMode', () => {
  it('returns advantage when only advantage flags are set', () => {
    expect(resolveRollMode([true, false], [false])).toBe('advantage');
  });

  it('returns disadvantage when only disadvantage flags are set', () => {
    expect(resolveRollMode([false], [true, false])).toBe('disadvantage');
  });

  it('cancels out to normal when both are present', () => {
    expect(resolveRollMode([true], [true])).toBe('normal');
  });

  it('returns normal when neither is present', () => {
    expect(resolveRollMode([false, false], [false])).toBe('normal');
  });
});
