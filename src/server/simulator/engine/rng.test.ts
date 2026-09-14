import { describe, expect, it } from 'vitest';
import { createRng, rollD20, rollDie } from '~/server/simulator/engine/rng';

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
