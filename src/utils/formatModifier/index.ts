/**
 * The canonical util: a folder with an `index.ts` and a colocated
 * `index.test.ts`, never a loose `formatModifier.ts`.
 *
 * Pure, no I/O, no React — so the browser-free `unit` project can test it.
 */

/**
 * Renders an ability or initiative modifier the way a character sheet does:
 * always signed, and `+0` rather than `0` or `-0`.
 */
export const formatModifier = (modifier: number): string => {
  if (!Number.isFinite(modifier)) return '+0';

  const rounded = Math.trunc(modifier);
  return rounded < 0 ? `${rounded}` : `+${rounded}`;
};

/**
 * The 5e mapping from an ability score to its modifier: floor((score - 10) / 2).
 */
export const abilityScoreToModifier = (score: number): number =>
  Math.floor((score - 10) / 2);
