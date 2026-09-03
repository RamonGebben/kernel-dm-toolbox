/**
 * Challenge rating conversions.
 *
 * Open5e stores CR as a decimal string ("10.000", "0.125"). Players and
 * statblocks read it as a fraction ("1/8"), and the encounter difficulty
 * calculation needs experience points — which the source data does not supply
 * (DECISIONS #17), so both XP and proficiency bonus are derived here.
 */

/** Challenge ratings below 1 are displayed as fractions, not decimals. */
const fractionalLabels: ReadonlyArray<readonly [number, string]> = [
  [0, '0'],
  [0.125, '1/8'],
  [0.25, '1/4'],
  [0.5, '1/2'],
] as const;

/** The XP awarded for defeating a creature of each challenge rating. */
const experienceByChallengeRating: Readonly<Record<string, number>> = {
  '0': 10,
  '0.125': 25,
  '0.25': 50,
  '0.5': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
  '21': 33000,
  '22': 41000,
  '23': 50000,
  '24': 62000,
  '25': 75000,
  '26': 90000,
  '27': 105000,
  '28': 120000,
  '29': 135000,
  '30': 155000,
} as const;

/** Parses Open5e's decimal string form into a number. */
export const parseChallengeRating = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** `0.125` renders as `1/8`, `10` as `10`. */
export const formatChallengeRating = (challengeRating: number): string => {
  const fraction = fractionalLabels.find(
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
