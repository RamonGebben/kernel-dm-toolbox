/** `0.5` -> `"50%"`, `0.333` -> `"33%"` (rounded, no decimal place — a DM
 * scanning a results panel wants a quick read, not false precision from a
 * Monte Carlo sample). */
export const formatPercent = (value: number): string =>
  `${Math.round(value * 100)}%`;
