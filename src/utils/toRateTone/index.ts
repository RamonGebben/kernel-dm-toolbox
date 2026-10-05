export type RateTone = 'good' | 'warning' | 'bad' | 'neutral';

/**
 * Bands a 0-1 rate into a three-tone read, the same shape `toHitPointTone`
 * uses for HP. `invert` flips which end is "good" — a high survival rate is
 * good, but a high went-down rate is bad, and both are read off the same
 * scale.
 */
export const toRateTone = (
  rate: number,
  options?: { invert?: boolean },
): RateTone => {
  const value = options?.invert ? 1 - rate : rate;
  if (value >= 0.66) return 'good';
  if (value >= 0.33) return 'warning';
  return 'bad';
};

/**
 * Kill rate isn't a 0-1 fraction (a combatant can average more than one kill
 * a trial), and zero isn't necessarily bad — a healer or controller PC can
 * legitimately score no kills. So this only colors in the positive
 * direction: no color for zero, warning for some, good for pulling real
 * weight (averaging a full kill a trial or more).
 */
export const toKillRateTone = (killRate: number): RateTone => {
  if (killRate <= 0) return 'neutral';
  if (killRate < 1) return 'warning';
  return 'good';
};
