import {
  experienceByChallengeRating,
  fractionalChallengeRatingLabels,
} from '~/content/challengeRating';

/**
 * Challenge rating conversions.
 *
 * Open5e stores CR as a decimal string ("10.000", "0.125"). Players and
 * statblocks read it as a fraction ("1/8"), and the encounter difficulty
 * calculation needs experience points — which the source data does not supply
 * (DECISIONS #17), so both XP and proficiency bonus are derived here.
 */

/** Parses Open5e's decimal string form into a number. */
export const parseChallengeRating = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** `0.125` renders as `1/8`, `10` as `10`. */
export const formatChallengeRating = (challengeRating: number): string => {
  const fraction = fractionalChallengeRatingLabels.find(
    ([value]) => value === challengeRating,
  );
  if (fraction) return fraction[1];

  return `${challengeRating}`;
};

/**
 * Proficiency bonus is fixed by challenge rating: +2 up to CR 4, then +1 for
 * every four ratings.
 */
export const proficiencyBonusForChallengeRating = (
  challengeRating: number,
): number => {
  if (challengeRating < 5) return 2;

  return 2 + Math.floor((challengeRating - 1) / 4);
};

/** Experience awarded for a creature of this challenge rating. */
export const experienceForChallengeRating = (challengeRating: number): number =>
  experienceByChallengeRating[`${challengeRating}`] ?? 0;
