import { describe, expect, it } from 'vitest';
import {
  toEngineActionFromSpell,
  type EngineSpellSourceFields,
} from '~/server/simulator/engine/toEngineActionFromSpell';

const baseSpell: EngineSpellSourceFields = {
  slug: 'srd-2024_fire-bolt',
  name: 'Fire Bolt',
  level: 0,
  castingTime: '1 action',
  range: 120,
  rangeUnit: 'feet',
  savingThrowAbility: null,
  attackRoll: true,
  damageRoll: '1d10',
  damageTypes: ['fire'],
  concentration: false,
  appliesConditionSlug: null,
  conditionDurationRounds: null,
  conditionSaveEndsEachTurn: false,
  shapeType: null,
  shapeSize: null,
};

describe('toEngineActionFromSpell', () => {
  it('maps an attack-roll cantrip with a ranged attack and no slot requirement', () => {
    const action = toEngineActionFromSpell(baseSpell, 5, 3);

    expect(action.id).toBe('spell:srd-2024_fire-bolt');
    expect(action.isSpell).toBe(true);
    expect(action.requiresSpellSlotLevel).toBeNull();
    expect(action.attack).toEqual(
      expect.objectContaining({
        reach: null,
        range: 120,
        damageDieCount: 1,
        damageDieType: 10,
        damageType: 'fire',
        // proficiency bonus at level 5 (+3) + ability modifier (3)
        toHitMod: 6,
      }),
    );
    expect(action.save).toBeNull();
    expect(action.maxUsesPerEncounter).toBeNull();
  });

  it('maps a leveled save-based spell with a condition and a slot requirement', () => {
    const holdPerson: EngineSpellSourceFields = {
      ...baseSpell,
      slug: 'srd-2024_hold-person',
      name: 'Hold Person',
      level: 2,
      attackRoll: false,
      damageRoll: null,
      damageTypes: [],
      savingThrowAbility: 'wisdom',
      concentration: true,
      appliesConditionSlug: 'srd-2024_paralyzed',
      conditionSaveEndsEachTurn: true,
      shapeType: null,
      shapeSize: null,
    };

    const action = toEngineActionFromSpell(holdPerson, 5, 3);

    expect(action.requiresSpellSlotLevel).toBe(2);
    expect(action.requiresConcentration).toBe(true);
    expect(action.attack).toBeNull();
    expect(action.save).toEqual(
      expect.objectContaining({
        saveAbility: 'wisdom',
        saveDc: 14, // 8 + proficiency (3) + ability modifier (3)
        appliesConditionKey: 'paralyzed',
        conditionSaveEndsEachTurn: true,
        halfDamageOnSave: true,
      }),
    );
  });

  it('reads a touch/self spell (no range unit) as a 5-foot reach', () => {
    const action = toEngineActionFromSpell(
      { ...baseSpell, attackRoll: true, range: 0, rangeUnit: null },
      1,
      0,
    );

    expect(action.attack?.reach).toBe(5);
    expect(action.attack?.range).toBeNull();
  });

  it('maps an AoE shape through the same sphere/cone/line/cube collapse creature actions use', () => {
    const fireball: EngineSpellSourceFields = {
      ...baseSpell,
      name: 'Fireball',
      level: 3,
      attackRoll: false,
      savingThrowAbility: 'dexterity',
      damageRoll: '8d6',
      damageTypes: ['fire'],
      shapeType: 'sphere',
      shapeSize: 20,
    };

    const action = toEngineActionFromSpell(fireball, 5, 3);

    expect(action.save).toEqual(
      expect.objectContaining({
        areaType: 'sphere',
        areaSize: 20,
        damageOnFailRoll: '8d6',
        damageOnFailType: 'fire',
      }),
    );
  });

  it('collapses an emanation shape to sphere, same as the creature-action parser', () => {
    const action = toEngineActionFromSpell(
      {
        ...baseSpell,
        attackRoll: false,
        savingThrowAbility: 'constitution',
        shapeType: 'emanation',
        shapeSize: 30,
      },
      5,
      3,
    );

    expect(action.save?.areaType).toBe('sphere');
  });

  it('leaves an unrecognised shape as no area', () => {
    const action = toEngineActionFromSpell(
      {
        ...baseSpell,
        attackRoll: false,
        savingThrowAbility: 'constitution',
        shapeType: 'weird-unmapped-shape',
        shapeSize: 30,
      },
      5,
      3,
    );

    expect(action.save?.areaType).toBeNull();
  });

  it('parses a bonus-action casting time', () => {
    const action = toEngineActionFromSpell(
      { ...baseSpell, castingTime: '1 bonus action' },
      1,
      0,
    );
    expect(action.actionType).toBe('BONUS_ACTION');
  });

  it('parses a reaction casting time', () => {
    const action = toEngineActionFromSpell(
      { ...baseSpell, castingTime: '1 reaction, which you take when...' },
      1,
      0,
    );
    expect(action.actionType).toBe('REACTION');
  });

  it('defaults an unrecognised casting time to a plain action', () => {
    const action = toEngineActionFromSpell(
      { ...baseSpell, castingTime: '10 minutes' },
      1,
      0,
    );
    expect(action.actionType).toBe('ACTION');
  });
});
