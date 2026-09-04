import { describe, expect, it } from 'vitest';
import { toSpellCastingOptionRow } from '~/server/library/mappers/toSpellCastingOptionRow';
import { spellCastingOptionFixtureSchema } from '~/server/library/fixtures';

const option = spellCastingOptionFixtureSchema.parse({
  model: 'api_v2.spellcastingoption',
  pk: 10000,
  fields: {
    parent: 'srd-2024_acid-arrow',
    type: 'slot_level_3',
    desc: null,
    damage_roll: '5d4',
    duration: null,
    range: null,
    target_count: null,
    shape_size: null,
    concentration: null,
  },
});

describe('toSpellCastingOptionRow', () => {
  it('stringifies the integer primary key', () => {
    expect(toSpellCastingOptionRow(option).id).toBe('10000');
  });

  it('hangs the option off its spell', () => {
    expect(toSpellCastingOptionRow(option).spellSlug).toBe(
      'srd-2024_acid-arrow',
    );
  });

  it('carries only what the higher slot changes', () => {
    const row = toSpellCastingOptionRow(option);

    expect(row.damageRoll).toBe('5d4');
    expect(row.duration).toBeNull();
    expect(row.concentration).toBeNull();
  });
});
