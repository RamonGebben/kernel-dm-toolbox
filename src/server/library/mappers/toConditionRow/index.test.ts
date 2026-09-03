import { describe, expect, it } from 'vitest';
import { toConditionRow } from '~/server/library/mappers/toConditionRow';
import { conditionFixtureSchema } from '~/server/library/fixtures';

const blinded = conditionFixtureSchema.parse({
  model: 'api_v2.conditiondescription',
  pk: 'srd-2024_blinded',
  fields: {
    describes: 'blinded',
    desc: 'While you have the Blinded condition…',
    document: 'srd-2024',
  },
});

describe('toConditionRow', () => {
  it('derives a display name, which the source data does not provide', () => {
    expect(toConditionRow(blinded).name).toBe('Blinded');
  });

  it('keeps the slug as the stable key combatants will reference', () => {
    expect(toConditionRow(blinded).key).toBe('blinded');
  });

  it('title-cases a multi-word condition slug', () => {
    const knockedOut = conditionFixtureSchema.parse({
      ...blinded,
      pk: 'srd-2024_knocked-out',
      fields: { ...blinded.fields, describes: 'knocked-out' },
    });

    expect(toConditionRow(knockedOut).name).toBe('Knocked Out');
  });
});
