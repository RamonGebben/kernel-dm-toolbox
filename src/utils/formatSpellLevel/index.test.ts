import { describe, expect, it } from 'vitest';
import { formatSpellLevel } from '~/utils/formatSpellLevel';

describe('formatSpellLevel', () => {
  it('renders level 0 as Cantrip', () => {
    expect(formatSpellLevel(0)).toBe('Cantrip');
  });

  it.each([
    [1, '1st-level'],
    [2, '2nd-level'],
    [3, '3rd-level'],
    [4, '4th-level'],
    [9, '9th-level'],
  ])('renders level %i as %s', (level, expected) => {
    expect(formatSpellLevel(level)).toBe(expected);
  });

  it('gives 11th-13th the "th" exception rather than "st"/"nd"/"rd"', () => {
    expect(formatSpellLevel(11)).toBe('11th-level');
    expect(formatSpellLevel(12)).toBe('12th-level');
    expect(formatSpellLevel(13)).toBe('13th-level');
  });

  it('treats a negative level the same as a cantrip', () => {
    expect(formatSpellLevel(-1)).toBe('Cantrip');
  });
});
