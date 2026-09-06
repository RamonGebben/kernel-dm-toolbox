import { describe, expect, it } from 'vitest';
import { buildSpellClassOptions } from '~/server/trpc/helpers/buildSpellClassOptions';

describe('buildSpellClassOptions', () => {
  it('dedupes classes shared across spells and labels them', () => {
    const options = buildSpellClassOptions([
      ['srd-2024_wizard', 'srd-2024_sorcerer'],
      ['srd-2024_wizard'],
      ['srd-2024_bard'],
    ]);

    expect(options).toEqual([
      { slug: 'srd-2024_bard', label: 'Bard' },
      { slug: 'srd-2024_sorcerer', label: 'Sorcerer' },
      { slug: 'srd-2024_wizard', label: 'Wizard' },
    ]);
  });

  it('sorts alphabetically by label', () => {
    const options = buildSpellClassOptions([
      ['srd-2024_warlock'],
      ['srd-2024_cleric'],
    ]);

    expect(options.map(option => option.label)).toEqual([
      'Cleric',
      'Warlock',
    ]);
  });

  it('returns nothing for an empty library', () => {
    expect(buildSpellClassOptions([])).toEqual([]);
  });
});
