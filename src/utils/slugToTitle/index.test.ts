import { describe, expect, it } from 'vitest';
import { slugToTitle } from '~/utils/slugToTitle';

describe('slugToTitle', () => {
  it.each([
    ['blinded', 'Blinded'],
    ['sleight-of-hand', 'Sleight Of Hand'],
    ['animal_handling', 'Animal Handling'],
  ])('renders %s as %s', (input, expected) => {
    expect(slugToTitle(input)).toBe(expected);
  });

  it('collapses repeated separators rather than emitting blanks', () => {
    expect(slugToTitle('a--b')).toBe('A B');
  });

  it('returns an empty string unchanged', () => {
    expect(slugToTitle('')).toBe('');
  });
});
