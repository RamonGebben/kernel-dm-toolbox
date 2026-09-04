/**
 * Static rules data: what a challenge rating is worth.
 *
 * Both tables exist because the source data does not supply them —
 * `experience_points_integer` and `proficiency_bonus` are null in 330 of the
 * 331 imported creatures (DECISIONS #17). They are exactly determined by CR in
 * the rules, so a lookup is complete rather than an approximation.
 *
 * Data lives here; the functions that use it live in
 * `~/utils/formatChallengeRating`.
 */

/** XP awarded for defeating a creature of each challenge rating. */
export const experienceByChallengeRating: Readonly<Record<string, number>> = {
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

/** Challenge ratings below 1 are written as fractions, not decimals. */
export const fractionalChallengeRatingLabels: ReadonlyArray<
  readonly [number, string]
> = [
  [0, '0'],
  [0.125, '1/8'],
  [0.25, '1/4'],
  [0.5, '1/2'],
] as const;
