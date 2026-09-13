import { describe, expect, it } from 'vitest';
import { toCustomCreatureRow } from '~/server/trpc/helpers/toCustomCreatureRow';
import type { CreateCustomCreatureInput } from '~/server/trpc/schemas/customCreatures';

const minimalInput: Omit<CreateCustomCreatureInput, 'traits' | 'actions'> = {
  name: 'Cave Bear',
  size: 'large',
  type: 'beast',
  alignment: 'unaligned',
  challengeRating: 2,
  armorClass: 12,
  hitPoints: 42,
  hitDice: '5d10 + 15',
  abilityScoreStrength: 20,
  abilityScoreDexterity: 10,
  abilityScoreConstitution: 16,
  abilityScoreIntelligence: 2,
  abilityScoreWisdom: 13,
  abilityScoreCharisma: 7,
  hover: false,
  passivePerception: 13,
};

describe('toCustomCreatureRow', () => {
  it('carries required fields straight through', () => {
    const row = toCustomCreatureRow(minimalInput);

    expect(row).toMatchObject({
      name: 'Cave Bear',
      armorClass: 12,
      hitPoints: 42,
      abilityScoreStrength: 20,
    });
  });

  it('coerces every absent optional field to null, not undefined', () => {
    const row = toCustomCreatureRow(minimalInput);

    expect(row.armorDetail).toBeNull();
    expect(row.initiativeBonus).toBeNull();
    expect(row.savingThrowStrength).toBeNull();
    expect(row.skillBonusStealth).toBeNull();
    expect(row.walk).toBeNull();
    expect(row.darkvisionRange).toBeNull();
    expect(row.damageResistancesDisplay).toBeNull();
    expect(row.languagesDesc).toBeNull();
  });

  it('passes explicit optional values through untouched', () => {
    const row = toCustomCreatureRow({
      ...minimalInput,
      armorDetail: 'natural armor',
      walk: 40,
      languagesDesc: '—',
    });

    expect(row.armorDetail).toBe('natural armor');
    expect(row.walk).toBe(40);
    expect(row.languagesDesc).toBe('—');
  });
});
