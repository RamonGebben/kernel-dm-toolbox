import { describe, expect, it } from 'vitest';
import { summarizeRange, summarizeSelection } from '~/utils/summarizeFilter';

const types = [
  { value: 'aberration', label: 'Aberration' },
  { value: 'dragon', label: 'Dragon' },
  { value: 'fiend', label: 'Fiend' },
  { value: 'undead', label: 'Undead' },
];

const challengeRatings = [
  { value: 0.25, label: '1/4' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
];

describe('summarizeSelection', () => {
  it('is null when nothing is selected, so the filter reads as unapplied', () => {
    expect(summarizeSelection(types, [])).toBeNull();
  });

  it('lists up to two labels', () => {
    expect(summarizeSelection(types, ['dragon'])).toBe('Dragon');
    expect(summarizeSelection(types, ['dragon', 'undead'])).toBe(
      'Dragon, Undead',
    );
  });

  it('collapses the rest into a count', () => {
    expect(
      summarizeSelection(types, ['undead', 'dragon', 'fiend', 'aberration']),
    ).toBe('Aberration, Dragon +2');
  });

  it('follows option order, not selection order', () => {
    expect(summarizeSelection(types, ['undead', 'dragon'])).toBe(
      'Dragon, Undead',
    );
  });

  it('falls back to the raw value for an option that has not loaded', () => {
    expect(summarizeSelection([], ['dragon'])).toBe('dragon');
  });
});

describe('summarizeRange', () => {
  it('is null with neither bound set', () => {
    expect(
      summarizeRange(challengeRatings, { min: null, max: null }),
    ).toBeNull();
  });

  it('shows both bounds as a span', () => {
    expect(summarizeRange(challengeRatings, { min: 0.25, max: 2 })).toBe(
      '1/4–2',
    );
  });

  it('shows a single value when the bounds agree', () => {
    expect(summarizeRange(challengeRatings, { min: 1, max: 1 })).toBe('1');
  });

  it('shows an open-ended bound with a comparison', () => {
    expect(summarizeRange(challengeRatings, { min: 0.25, max: null })).toBe(
      '≥ 1/4',
    );
    expect(summarizeRange(challengeRatings, { min: null, max: 2 })).toBe('≤ 2');
  });

  it('treats a bound of zero as set, not as missing', () => {
    expect(
      summarizeRange([{ value: 0, label: '0' }], { min: 0, max: null }),
    ).toBe('≥ 0');
  });
});
