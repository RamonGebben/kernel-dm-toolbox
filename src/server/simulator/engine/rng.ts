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
