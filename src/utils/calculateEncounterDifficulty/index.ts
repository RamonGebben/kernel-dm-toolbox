import {
  experienceBudgetByLevel,
  type DifficultyBand,
  type EncounterDifficulty,
} from '~/content/encounterDifficulty';
import { experienceForChallengeRating } from '~/utils/formatChallengeRating';

export type DifficultyResult = {
  /** Total XP of every monster in the fight. */
  totalExperience: number;
  /** The party's combined budget at each band. */
  budget: Record<DifficultyBand, number>;
  difficulty: EncounterDifficulty;
  /** False when there is no party to measure the fight against. */
  hasParty: boolean;
};

/** Typed rather than `as const`: it seeds a reduce that accumulates numbers. */
const EMPTY_BUDGET: Record<DifficultyBand, number> = {
  low: 0,
  moderate: 0,
  high: 0,
};

/** Levels outside 1–20 clamp rather than producing an undefined budget. */
const budgetForLevel = (level: number) =>
  experienceBudgetByLevel[Math.min(20, Math.max(1, Math.trunc(level)))];

/**
 * How hard this fight is for this party.
 *
 * The 2024 rules compare the monsters' total XP against a per-character budget
 * summed across the party — there is no multiplier for the number of monsters,
 * which the older rules had. Above the High budget the fight is past what the
 * bands describe, so it is reported as Deadly rather than clamped to High: a
 * DM needs to know they have gone off the end of the table.
 */
export const calculateEncounterDifficulty = ({
  partyLevels,
  monsterChallengeRatings,
}: {
  partyLevels: readonly number[];
  monsterChallengeRatings: readonly number[];
}): DifficultyResult => {
  const totalExperience = monsterChallengeRatings.reduce(
    (total, challengeRating) =>
      total + experienceForChallengeRating(challengeRating),
    0,
  );

  if (!partyLevels.length) {
    return {
      totalExperience,
      budget: { ...EMPTY_BUDGET },
      difficulty: 'trivial',
      hasParty: false,
    };
  }

  const budget = partyLevels.reduce(
    (total, level) => {
      const share = budgetForLevel(level);

      return {
        low: total.low + share.low,
        moderate: total.moderate + share.moderate,
        high: total.high + share.high,
      };
    },
    { ...EMPTY_BUDGET },
  );

  return {
    totalExperience,
    budget,
    difficulty: toDifficulty(totalExperience, budget),
    hasParty: true,
  };
};

const toDifficulty = (
  totalExperience: number,
  budget: Record<DifficultyBand, number>,
): EncounterDifficulty => {
  if (totalExperience === 0) return 'trivial';
  if (totalExperience > budget.high) return 'deadly';
  if (totalExperience > budget.moderate) return 'high';
  if (totalExperience > budget.low) return 'moderate';

  return 'low';
};
