export type Divisor = 1 | 2 | 4;

/**
 * Halves or quarters a rolled total for a resistant/vulnerable target, DM-
 * triggered rather than derived from any stored resistance data. Floors per
 * 5e RAW, and never below 1 — `encounter.damage`/`.heal` reject a zero amount.
 */
export const applyDivisor = (total: number, divisor: Divisor): number =>
  Math.max(1, Math.floor(total / divisor));
