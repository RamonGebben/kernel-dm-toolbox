/**
 * A tiny seeded PRNG (mulberry32) — deterministic so a single seed can be
 * replayed for an animated run (milestone 5) and cheaply re-seeded per trial
 * for a Monte Carlo batch (milestone 6). `Math.random` cannot serve either
 * use case: it can't be replayed and can't be pinned per-trial.
 */
export type Rng = () => number;

export const createRng = (seed: number): Rng => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** An integer in `[1, sides]`, the way a physical die reads. */
export const rollDie = (rng: Rng, sides: number): number =>
  Math.floor(rng() * sides) + 1;

export const rollD20 = (rng: Rng): number => rollDie(rng, 20);

/** Advantage/disadvantage per 5e's condition rules (issue #5, milestone 10)
 * — roll twice, keep the higher (advantage) or lower (disadvantage). Always
 * consumes two rolls from `rng` when not `'normal'`, so a seeded run stays
 * deterministic regardless of which mode a given roll ends up needing. */
export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export const rollD20WithMode = (rng: Rng, mode: RollMode): number => {
  const first = rollD20(rng);
  if (mode === 'normal') return first;
  const second = rollD20(rng);
  return mode === 'advantage' ? Math.max(first, second) : Math.min(first, second);
};
