import { describe, expect, it } from 'vitest';
import type { Rng } from '~/server/simulator/engine/rng';
import {
  createRng,
  rollD20,
  rollD20WithMode,
  rollDie,
} from '~/server/simulator/engine/rng';

/** Replays a fixed sequence of pre-chosen `rollD20` results instead of a
 * real seeded stream, so a `rollD20WithMode` test can assert exactly which
 * of the two rolls it kept. */
const fakeRng = (values: number[]): Rng => {
  let index = 0;
  return () => {
    const value = values[index] ?? 0;
    index += 1;
    return value;
  };
};
const valueForD20 = (roll: number): number => (roll - 1) / 20;

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(42);
    const b = createRng(42);

    const sequenceA = Array.from({ length: 10 }, () => a());
    const sequenceB = Array.from({ length: 10 }, () => b());

    expect(sequenceA).toEqual(sequenceB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);

    expect(a()).not.toBe(b());
  });

  it('stays within [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('rollDie', () => {
  it('stays within [1, sides]', () => {
    const rng = createRng(11);
    for (let i = 0; i < 1000; i += 1) {
      const roll = rollDie(rng, 6);
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
    }
  });
});

describe('rollD20', () => {
  it('stays within [1, 20]', () => {
    const rng = createRng(99);
    for (let i = 0; i < 1000; i += 1) {
      const roll = rollD20(rng);
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(20);
    }
  });
});

describe('rollD20WithMode', () => {
  it('rolls once and returns it unchanged in normal mode', () => {
    const rng = fakeRng([valueForD20(11)]);
    expect(rollD20WithMode(rng, 'normal')).toBe(11);
  });

  it('rolls twice and keeps the higher result with advantage', () => {
    const rng = fakeRng([valueForD20(5), valueForD20(17)]);
    expect(rollD20WithMode(rng, 'advantage')).toBe(17);
  });

  it('rolls twice and keeps the lower result with disadvantage', () => {
    const rng = fakeRng([valueForD20(5), valueForD20(17)]);
    expect(rollD20WithMode(rng, 'disadvantage')).toBe(5);
  });

  it('always consumes two rolls when not normal, for deterministic replay', () => {
    const values = [valueForD20(10), valueForD20(10)];
    const rng = fakeRng(values);
    rollD20WithMode(rng, 'advantage');
    // a third call would return the fallback 0-value fakeRng uses past the
    // end of its sequence — proving exactly two rolls were consumed above
    expect(rollDie(rng, 20)).toBe(1);
  });
});
