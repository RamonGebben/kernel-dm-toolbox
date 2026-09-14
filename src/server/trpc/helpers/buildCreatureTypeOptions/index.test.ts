import { describe, expect, it } from 'vitest';
import { buildCreatureTypeOptions } from '~/server/trpc/helpers/buildCreatureTypeOptions';

describe('buildCreatureTypeOptions', () => {
  it('dedupes case-insensitively and title-cases the label', () => {
    expect(buildCreatureTypeOptions(['dragon', 'Dragon', 'undead'])).toEqual([
      { value: 'dragon', label: 'Dragon' },
      { value: 'undead', label: 'Undead' },
    ]);
  });

  it('title-cases a multi-word type', () => {
    expect(buildCreatureTypeOptions(['swarm of tiny beasts'])).toEqual([
      { value: 'swarm of tiny beasts', label: 'Swarm Of Tiny Beasts' },
    ]);
  });

  it('sorts alphabetically by label', () => {
    expect(
      buildCreatureTypeOptions(['undead', 'construct', 'aberration']).map(
        option => option.value,
      ),
    ).toEqual(['aberration', 'construct', 'undead']);
  });

  it('ignores blank entries', () => {
    expect(buildCreatureTypeOptions(['', '  ', 'ooze'])).toEqual([
      { value: 'ooze', label: 'Ooze' },
    ]);
  });

  it('returns an empty list for no input', () => {
    expect(buildCreatureTypeOptions([])).toEqual([]);
  });
});
