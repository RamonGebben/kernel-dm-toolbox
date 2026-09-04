export type HitPoints = {
  currentHitPoints: number;
  temporaryHitPoints: number;
  maxHitPoints: number;
};

/**
 * Damage and healing, by the book.
 *
 * Temporary hit points absorb damage first and are not restored by healing —
 * getting either of those wrong is the classic bug in a tracker, so both are
 * pinned by tests.
 */
export const applyDamage = (
  hitPoints: HitPoints,
  amount: number,
): HitPoints => {
  if (amount <= 0) return hitPoints;

  const absorbed = Math.min(hitPoints.temporaryHitPoints, amount);
  const remaining = amount - absorbed;

  return {
    ...hitPoints,
    temporaryHitPoints: hitPoints.temporaryHitPoints - absorbed,
    // A creature stops at 0; negative hit points are not tracked.
    currentHitPoints: Math.max(0, hitPoints.currentHitPoints - remaining),
  };
};

/** Healing never exceeds the maximum, and never touches temporary hit points. */
export const applyHealing = (
  hitPoints: HitPoints,
  amount: number,
): HitPoints => {
  if (amount <= 0) return hitPoints;

  return {
    ...hitPoints,
    currentHitPoints: Math.min(
      hitPoints.maxHitPoints,
      hitPoints.currentHitPoints + amount,
    ),
  };
};

/** Temporary hit points do not stack: the larger pool replaces the smaller. */
export const applyTemporaryHitPoints = (
  hitPoints: HitPoints,
  amount: number,
): HitPoints => ({
  ...hitPoints,
  temporaryHitPoints: Math.max(
    hitPoints.temporaryHitPoints,
    Math.max(0, amount),
  ),
});

export type HealthStatus = 'healthy' | 'bloodied' | 'unconscious';

/**
 * What the players are allowed to see instead of exact monster hit points
 * (DECISIONS #18). Bloodied is the traditional half-or-below.
 */
export const toHealthStatus = ({
  currentHitPoints,
  maxHitPoints,
}: Pick<HitPoints, 'currentHitPoints' | 'maxHitPoints'>): HealthStatus => {
  if (currentHitPoints <= 0) return 'unconscious';
  if (maxHitPoints > 0 && currentHitPoints * 2 <= maxHitPoints)
    return 'bloodied';

  return 'healthy';
};

export type HitPointTone = 'full' | 'damaged' | 'down';

/**
 * How the DM's own hit point column is coloured — distinct from
 * `toHealthStatus`, which is the coarser thing players are shown. The DM sees
 * exact numbers and wants "has this taken any damage at all?" at a glance.
 */
export const toHitPointTone = ({
  currentHitPoints,
  maxHitPoints,
}: Pick<HitPoints, 'currentHitPoints' | 'maxHitPoints'>): HitPointTone => {
  if (currentHitPoints <= 0) return 'down';
  if (currentHitPoints >= maxHitPoints) return 'full';

  return 'damaged';
};
