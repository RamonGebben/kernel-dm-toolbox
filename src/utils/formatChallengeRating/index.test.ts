import { describe, expect, it } from 'vitest';
import {
  experienceForChallengeRating,
  formatChallengeRating,
  parseChallengeRating,
  proficiencyBonusForChallengeRating,
} from '~/utils/formatChallengeRating';

describe('parseChallengeRating', () => {
  it.each([
    ['10.000', 10],
    ['0.125', 0.125],
    ['0.000', 0],
    ['30.000', 30],
  ])('parses %s as %d', (input, expected) => {
    expect(parseChallengeRating(input)).toBe(expected);
  });

  it('falls back to 0 for an unparseable value', () => {
    expect(parseChallengeRating('unknown')).toBe(0);
  });
});

describe('formatChallengeRating', () => {
  it.each([
    [0, '0'],
    [0.125, '1/8'],
    [0.25, '1/4'],
    [0.5, '1/2'],
    [1, '1'],
    [10, '10'],
    [30, '30'],
  ])('renders %d as %s', (input, expected) => {
    expect(formatChallengeRating(input)).toBe(expected);
  });
});

describe('proficiencyBonusForChallengeRating', () => {
  it.each([
    [0, 2],
    [0.125, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [13, 5],
    [17, 6],
    [21, 7],
    [25, 8],
    [29, 9],
  ])('gives CR %d a bonus of +%d', (challengeRating, expected) => {
    expect(proficiencyBonusForChallengeRating(challengeRating)).toBe(expected);
  });
});

describe('experienceForChallengeRating', () => {
  it('matches the published table', () => {
    expect(experienceForChallengeRating(0)).toBe(10);
    expect(experienceForChallengeRating(0.125)).toBe(25);
    expect(experienceForChallengeRating(1)).toBe(200);
    // The young black dragon in the reference screenshot is CR 7 / 2900 XP.
    expect(experienceForChallengeRating(7)).toBe(2900);
    expect(experienceForChallengeRating(30)).toBe(155000);
  });

  it('returns 0 for a rating that is not on the table', () => {
    expect(experienceForChallengeRating(31)).toBe(0);
  });
});
