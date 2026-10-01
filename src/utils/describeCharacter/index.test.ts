import { describe, expect, it } from 'vitest';
import { describeCharacter } from '~/utils/describeCharacter';

const blank = { level: 5, className: null, subclass: null, species: null };

describe('describeCharacter', () => {
  it('reads everything in sheet order', () => {
    expect(
      describeCharacter({
        level: 5,
        className: 'Paladin',
        subclass: 'Oath of Glory',
        species: 'Goliath',
      }),
    ).toBe('Level 5 Goliath Paladin · Oath of Glory');
  });

  it('falls back to just the level for a numbers-only character', () => {
    expect(describeCharacter(blank)).toBe('Level 5');
  });

  it('skips a missing species', () => {
    expect(describeCharacter({ ...blank, className: 'Rogue' })).toBe(
      'Level 5 Rogue',
    );
  });

  it('keeps a subclass even without a class', () => {
    expect(describeCharacter({ ...blank, subclass: 'Hunter' })).toBe(
      'Level 5 · Hunter',
    );
  });
});
