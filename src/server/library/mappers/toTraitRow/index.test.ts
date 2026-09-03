import { describe, expect, it } from 'vitest';
import { toTraitRow } from '~/server/library/mappers/toTraitRow';
import { creatureTraitFixtureSchema } from '~/server/library/fixtures';

const amphibious = creatureTraitFixtureSchema.parse({
  model: 'api_v2.creaturetrait',
  pk: 'srd-2024_aboleth_amphibious',
  fields: {
    name: 'Amphibious',
    desc: 'The aboleth can breathe air and water.',
    parent: 'srd-2024_aboleth',
  },
});

describe('toTraitRow', () => {
  it('links the trait to its creature', () => {
    expect(toTraitRow(amphibious).creatureSlug).toBe('srd-2024_aboleth');
  });

  it('keeps the name and description used by the statblock', () => {
    const row = toTraitRow(amphibious);

    expect(row.name).toBe('Amphibious');
    expect(row.desc).toBe('The aboleth can breathe air and water.');
  });

  it('tolerates the absent type field', () => {
    expect(toTraitRow(amphibious).type).toBeNull();
  });
});
