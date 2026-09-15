import { describe, expect, it } from 'vitest';
import { toSpellRow } from '~/server/library/mappers/toSpellRow';
import { spellFixtureSchema } from '~/server/library/fixtures';

const NO_CONDITIONS = new Map<string, string>();

const acidArrow = spellFixtureSchema.parse({
  model: 'api_v2.spell',
  pk: 'srd-2024_acid-arrow',
  fields: {
    name: 'Acid Arrow',
    desc: 'A shimmering green arrow streaks toward a target.',
    document: 'srd-2024',
    level: 2,
    school: 'evocation',
    higher_level: 'The damage increases by 1d4.',
    target_type: 'creature',
    range_text: '90 feet',
    range: 90,
    range_unit: 'feet',
    ritual: false,
    casting_time: 'action',
    reaction_condition: null,
    verbal: true,
    somatic: true,
    material: true,
    material_specified: 'powdered rhubarb leaf',
    material_consumed: false,
    target_count: 1,
    saving_throw_ability: '',
    attack_roll: true,
    damage_roll: '4d4',
    damage_types: ['acid'],
    duration: 'instantaneous',
    shape_type: null,
    shape_size: null,
    shape_size_unit: null,
    concentration: false,
    classes: ['srd-2024_wizard'],
  },
});

describe('toSpellRow', () => {
  it('keys the row on the upstream slug', () => {
    expect(toSpellRow(acidArrow, NO_CONDITIONS).slug).toBe(
      'srd-2024_acid-arrow',
    );
  });

  it('keeps the numeric range and the prose upstream renders', () => {
    const row = toSpellRow(acidArrow, NO_CONDITIONS);

    expect(row.range).toBe(90);
    expect(row.rangeText).toBe('90 feet');
  });

  it('turns an empty saving throw into null, not an empty string', () => {
    expect(toSpellRow(acidArrow, NO_CONDITIONS).savingThrowAbility).toBeNull();
  });

  it('keeps the class and damage type lists queryable', () => {
    const row = toSpellRow(acidArrow, NO_CONDITIONS);

    expect(row.classes).toEqual(['srd-2024_wizard']);
    expect(row.damageTypes).toEqual(['acid']);
  });

  it('treats a cantrip as level zero rather than as missing', () => {
    const cantrip = spellFixtureSchema.parse({
      ...acidArrow,
      pk: 'srd-2024_fire-bolt',
      fields: { ...acidArrow.fields, level: 0, higher_level: '' },
    });

    const row = toSpellRow(cantrip, NO_CONDITIONS);
    expect(row.level).toBe(0);
    expect(row.higherLevel).toBeNull();
  });

  it('leaves condition application null for a spell that applies no condition', () => {
    expect(
      toSpellRow(acidArrow, NO_CONDITIONS).appliesConditionSlug,
    ).toBeNull();
  });

  it('resolves appliesConditionSlug through the passed-in condition lookup', () => {
    const holdPerson = spellFixtureSchema.parse({
      ...acidArrow,
      pk: 'srd-2024_hold-person',
      fields: {
        ...acidArrow.fields,
        name: 'Hold Person',
        desc: 'Choose a Humanoid that you can see within range. The target must succeed on a Wisdom saving throw or have the Paralyzed condition for the duration. At the end of each of its turns, the target repeats the save, ending the spell on itself on a success.',
        saving_throw_ability: 'wisdom',
        concentration: true,
      },
    });

    const conditionSlugByKey = new Map([['paralyzed', 'srd-2024_paralyzed']]);
    const row = toSpellRow(holdPerson, conditionSlugByKey);

    expect(row.appliesConditionSlug).toBe('srd-2024_paralyzed');
    expect(row.conditionSaveEndsEachTurn).toBe(true);
    expect(row.concentration).toBe(true);
  });
});
