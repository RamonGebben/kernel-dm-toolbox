import { describe, expect, it } from 'vitest';
import { toEngineAction } from '~/server/simulator/engine/toEngineAction';
import type {
  EngineActionSourceFields,
  EngineAttackSourceFields,
} from '~/server/simulator/engine/toEngineAction';

const baseAction: EngineActionSourceFields = {
  name: 'Bite',
  actionType: 'ACTION',
  legendaryActionCost: null,
  usesType: null,
  usesParam: null,
  saveAbility: null,
  saveDc: null,
  areaType: null,
  areaSize: null,
  damageOnFailRoll: null,
  damageOnFailType: null,
  halfDamageOnSave: true,
  appliesConditionSlug: null,
  conditionDurationRounds: null,
  conditionSaveEndsEachTurn: false,
};

const baseAttack: EngineAttackSourceFields = {
  toHitMod: 5,
  reach: 5,
  range: null,
  damageDieCount: 2,
  damageDieType: 'D6',
  damageBonus: 3,
  damageType: 'piercing',
  extraDamageDieCount: null,
  extraDamageDieType: null,
  extraDamageBonus: null,
  extraDamageType: null,
};

describe('toEngineAction', () => {
  it('maps a basic attack action', () => {
    const result = toEngineAction('action-1', baseAction, baseAttack);

    expect(result).toMatchObject({
      id: 'action-1',
      name: 'Bite',
      actionType: 'ACTION',
      attack: {
        toHitMod: 5,
        reach: 5,
        damageDieCount: 2,
        damageDieType: 6,
        damageBonus: 3,
      },
      save: null,
      maxUsesPerEncounter: null,
    });
  });

  it('parses a lowercase die-type label from the custom-creature wizard', () => {
    const result = toEngineAction('action-1', baseAction, {
      ...baseAttack,
      damageDieType: 'd8',
    });

    expect(result.attack?.damageDieType).toBe(8);
  });

  it('zeroes out dice count when the die-type label is unparseable', () => {
    const result = toEngineAction('action-1', baseAction, {
      ...baseAttack,
      damageDieType: 'a rock',
    });

    expect(result.attack?.damageDieCount).toBe(0);
  });

  it('maps a save-based action with area data', () => {
    const result = toEngineAction(
      'action-2',
      {
        ...baseAction,
        name: 'Acid Breath',
        saveAbility: 'dexterity',
        saveDc: 15,
        areaType: 'line',
        areaSize: 30,
        damageOnFailRoll: '10d6',
        damageOnFailType: 'acid',
      },
      null,
    );

    expect(result).toMatchObject({
      attack: null,
      save: {
        saveAbility: 'dexterity',
        saveDc: 15,
        areaType: 'line',
        areaSize: 30,
        damageOnFailRoll: '10d6',
        damageOnFailType: 'acid',
        halfDamageOnSave: true,
      },
    });
  });

  it('derives maxUsesPerEncounter from usesType/usesParam', () => {
    expect(
      toEngineAction(
        'a',
        { ...baseAction, usesType: 'recharge', usesParam: 1 },
        null,
      ).maxUsesPerEncounter,
    ).toBe(1);

    expect(
      toEngineAction(
        'a',
        { ...baseAction, usesType: '1/day', usesParam: null },
        null,
      ).maxUsesPerEncounter,
    ).toBe(1);

    expect(
      toEngineAction('a', baseAction, null).maxUsesPerEncounter,
    ).toBeNull();
  });

  it('has no attack when none is provided', () => {
    expect(toEngineAction('a', baseAction, null).attack).toBeNull();
  });

  it('normalizes a versioned condition slug down to its short key', () => {
    const result = toEngineAction(
      'action-3',
      {
        ...baseAction,
        saveAbility: 'constitution',
        saveDc: 13,
        appliesConditionSlug: 'srd-2024_paralyzed',
        conditionDurationRounds: 10,
        conditionSaveEndsEachTurn: true,
      },
      null,
    );

    expect(result.save).toMatchObject({
      appliesConditionKey: 'paralyzed',
      conditionDurationRounds: 10,
      conditionSaveEndsEachTurn: true,
    });
  });

  it('leaves appliesConditionKey null when no condition slug is set', () => {
    const result = toEngineAction(
      'action-4',
      { ...baseAction, saveAbility: 'dexterity', saveDc: 12 },
      null,
    );

    expect(result.save?.appliesConditionKey).toBeNull();
  });

  it('never sets requiresConcentration, since no source table has one yet', () => {
    expect(toEngineAction('a', baseAction, null).requiresConcentration).toBe(
      false,
    );
  });
});
