import { describe, expect, it } from 'vitest';
import { toCreatureRow } from '~/server/library/mappers/toCreatureRow';
import { creatureFixtureSchema } from '~/server/library/fixtures';

/** A trimmed copy of the real `srd-2024_aboleth` record. */
const aboleth = creatureFixtureSchema.parse({
  model: 'api_v2.creature',
  pk: 'srd-2024_aboleth',
  fields: {
    name: 'Aboleth',
    document: 'srd-2024',
    size: 'large',
    type: 'aberration',
    category: 'Monsters',
    alignment: 'lawful evil',
    challenge_rating: '10.000',
    armor_class: 17,
    armor_detail: 'natural armor',
    hit_points: 150,
    hit_dice: '20d10 + 40',
    initiative_bonus: 7,
    ability_score_strength: 21,
    ability_score_dexterity: 9,
    ability_score_constitution: 15,
    ability_score_intelligence: 18,
    ability_score_wisdom: 15,
    ability_score_charisma: 18,
    saving_throw_wisdom: 6,
    skill_bonus_history: 12,
    skill_bonus_perception: 10,
    walk: 10,
    swim: 40,
    darkvision_range: 120,
    telepathy_range: 120,
    passive_perception: 20,
    condition_immunities: ['poisoned'],
    condition_immunities_display: 'poisoned',
    languages: ['deep-speech'],
    languages_desc: 'Deep Speech; telepathy 120 ft.',
  },
});

describe('toCreatureRow', () => {
  it('keys the row on the upstream slug, which makes re-import an upsert', () => {
    expect(toCreatureRow(aboleth).slug).toBe('srd-2024_aboleth');
  });

  it('converts the decimal challenge rating string to a number', () => {
    expect(toCreatureRow(aboleth).challengeRating).toBe(10);
  });

  it('carries the precomputed initiative bonus through', () => {
    expect(toCreatureRow(aboleth).initiativeBonus).toBe(7);
  });

  it('keeps both the slug array and the rendered display string', () => {
    const row = toCreatureRow(aboleth);

    expect(row.conditionImmunities).toEqual(['poisoned']);
    expect(row.conditionImmunitiesDisplay).toBe('poisoned');
  });

  it('defaults absent list fields to an empty array, never null', () => {
    const row = toCreatureRow(aboleth);

    expect(row.damageImmunities).toEqual([]);
    expect(row.damageResistances).toEqual([]);
  });

  it('preserves nulls for the many sparse skill bonuses', () => {
    const row = toCreatureRow(aboleth);

    expect(row.skillBonusHistory).toBe(12);
    expect(row.skillBonusStealth).toBeNull();
  });

  it('maps every movement mode it was given and nulls the rest', () => {
    const row = toCreatureRow(aboleth);

    expect(row.walk).toBe(10);
    expect(row.swim).toBe(40);
    expect(row.fly).toBeNull();
    expect(row.burrow).toBeNull();
  });

  it('renders a fractional challenge rating as a fraction of one', () => {
    const commoner = creatureFixtureSchema.parse({
      ...aboleth,
      pk: 'srd-2024_commoner',
      fields: { ...aboleth.fields, challenge_rating: '0.125' },
    });

    expect(toCreatureRow(commoner).challengeRating).toBe(0.125);
  });
});
