import { describe, expect, it } from 'vitest';
import { toCharacterClassRow } from '~/server/library/mappers/toCharacterClassRow';
import { characterClassFixtureSchema } from '~/server/library/fixtures';

const barbarian = characterClassFixtureSchema.parse({
  model: 'api_v2.characterclass',
  pk: 'srd-2024_barbarian',
  fields: {
    name: 'Barbarian',
    document: 'srd-2024',
    hit_dice: 'D12',
    caster_type: 'NONE',
    primary_abilities: [],
    saving_throws: ['con', 'str'],
    subclass_of: null,
  },
});

const pathOfTheBerserker = characterClassFixtureSchema.parse({
  model: 'api_v2.characterclass',
  pk: 'srd-2024_path-of-the-berserker',
  fields: {
    name: 'Path of the Berserker',
    document: 'srd-2024',
    desc: 'For some barbarians, rage is a means to an end...',
    hit_dice: null,
    caster_type: 'NONE',
    primary_abilities: [],
    saving_throws: [],
    subclass_of: 'srd-2024_barbarian',
  },
});

describe('toCharacterClassRow', () => {
  it('maps a base class with no parent', () => {
    const row = toCharacterClassRow(barbarian);

    expect(row.slug).toBe('srd-2024_barbarian');
    expect(row.hitDice).toBe('D12');
    expect(row.casterType).toBe('NONE');
    expect(row.savingThrows).toEqual(['con', 'str']);
    expect(row.subclassOfSlug).toBeNull();
  });

  it('links a subclass to its parent through subclassOfSlug', () => {
    const row = toCharacterClassRow(pathOfTheBerserker);

    expect(row.subclassOfSlug).toBe('srd-2024_barbarian');
    expect(row.hitDice).toBeNull();
    expect(row.desc).toContain('rage is a means to an end');
  });
});
