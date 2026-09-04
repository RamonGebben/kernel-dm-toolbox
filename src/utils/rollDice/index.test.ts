import { describe, expect, it } from 'vitest';
import { rollD20, rollInitiative } from '~/utils/rollDice';

describe('rollD20', () => {
  it('only ever produces a face that exists on the die', () => {
    const results = Array.from({ length: 500 }, () => rollD20());

    expect(Math.min(...results)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...results)).toBeLessThanOrEqual(20);
    expect(results.every(Number.isInteger)).toBe(true);
  });
});

describe('rollInitiative', () => {
  it('adds the creature bonus to the die', () => {
    expect(rollInitiative(5, () => 12)).toBe(17);
  });

  it('treats a missing bonus as zero rather than NaN', () => {
    expect(rollInitiative(null, () => 12)).toBe(12);
  });

  it('handles a negative bonus', () => {
    expect(rollInitiative(-1, () => 3)).toBe(2);
  });

  it('can go below zero on a bad roll with a penalty', () => {
    expect(rollInitiative(-3, () => 1)).toBe(-2);
  });
});
