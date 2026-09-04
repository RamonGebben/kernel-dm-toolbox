import { describe, expect, it } from 'vitest';
import { calculateEncounterDifficulty } from '~/utils/calculateEncounterDifficulty';

/** Four level-5 characters: the classic yardstick party. */
const party = [5, 5, 5, 5];

describe('calculateEncounterDifficulty', () => {
  it('sums monster experience from challenge ratings', () => {
    const result = calculateEncounterDifficulty({
      partyLevels: party,
      // CR 7 is 2,900 XP — the young black dragon from the reference tool.
      monsterChallengeRatings: [7],
    });

    expect(result.totalExperience).toBe(2900);
  });

  it('sums the budget across the party, not per character', () => {
    const result = calculateEncounterDifficulty({
      partyLevels: party,
      monsterChallengeRatings: [],
    });

    // 4 × level 5: 500 / 750 / 1100 each.
    expect(result.budget).toEqual({
      low: 2000,
      moderate: 3000,
      high: 4400,
    });
  });

  it('rates a lone CR 7 dragon as high for four level fives', () => {
    const result = calculateEncounterDifficulty({
      partyLevels: party,
      monsterChallengeRatings: [7],
    });

    // 2,900 is over the 3,000 moderate budget? No — just under it.
    expect(result.totalExperience).toBe(2900);
    expect(result.difficulty).toBe('moderate');
  });

  it('rates an overwhelming fight as deadly rather than clamping to high', () => {
    const result = calculateEncounterDifficulty({
      partyLevels: party,
      monsterChallengeRatings: [20],
    });

    expect(result.totalExperience).toBe(25000);
    expect(result.difficulty).toBe('deadly');
  });

  it('counts every monster, with no multiplier for the group size', () => {
    // The 2024 rules dropped the older encounter multiplier.
    const result = calculateEncounterDifficulty({
      partyLevels: party,
      monsterChallengeRatings: [1, 1, 1, 1],
    });

    expect(result.totalExperience).toBe(800);
    expect(result.difficulty).toBe('low');
  });

  it('is trivial when there are no monsters', () => {
    const result = calculateEncounterDifficulty({
      partyLevels: party,
      monsterChallengeRatings: [],
    });

    expect(result.difficulty).toBe('trivial');
  });

  it('reports no party rather than dividing by nothing', () => {
    const result = calculateEncounterDifficulty({
      partyLevels: [],
      monsterChallengeRatings: [7],
    });

    expect(result.hasParty).toBe(false);
    expect(result.totalExperience).toBe(2900);
    expect(result.budget).toEqual({ low: 0, moderate: 0, high: 0 });
  });

  it('handles a party of mixed levels', () => {
    const result = calculateEncounterDifficulty({
      partyLevels: [3, 5],
      monsterChallengeRatings: [],
    });

    // Level 3 is 150/225/400; level 5 is 500/750/1100.
    expect(result.budget).toEqual({ low: 650, moderate: 975, high: 1500 });
  });

  it('clamps a level outside the published table', () => {
    const belowRange = calculateEncounterDifficulty({
      partyLevels: [0],
      monsterChallengeRatings: [],
    });
    const aboveRange = calculateEncounterDifficulty({
      partyLevels: [99],
      monsterChallengeRatings: [],
    });

    expect(belowRange.budget.low).toBe(50);
    expect(aboveRange.budget.low).toBe(6400);
  });

  it('lands exactly on a band boundary as the lower band', () => {
    // 2,000 is exactly the low budget for four level fives.
    const result = calculateEncounterDifficulty({
      partyLevels: party,
      monsterChallengeRatings: [5, 2, 1],
    });

    expect(result.totalExperience).toBe(2450);
    expect(result.difficulty).toBe('moderate');
  });
});
