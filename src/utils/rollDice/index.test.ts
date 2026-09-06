import { describe, expect, it } from 'vitest';
import { rollD20, rollExpression, rollInitiative } from '~/utils/rollDice';

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

describe('rollExpression', () => {
  it('sums a fixed sequence of rolls plus the modifier', () => {
    const rolls = [5, 2, 6, 1, 4, 3, 6, 2];
    let index = 0;

    expect(rollExpression(8, 6, 4, () => rolls[index++])).toEqual({
      rolls,
      total: 33,
    });
  });

  it('applies a negative modifier', () => {
    expect(rollExpression(1, 4, -1, () => 3)).toEqual({
      rolls: [3],
      total: 2,
    });
  });

  it('rolls nothing for a count of zero, keeping just the modifier', () => {
    expect(rollExpression(0, 6, 5, () => 4)).toEqual({
      rolls: [],
      total: 5,
    });
  });

  it('only ever produces faces that exist on the die', () => {
    const { rolls } = rollExpression(500, 6, 0);

    expect(Math.min(...rolls)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...rolls)).toBeLessThanOrEqual(6);
    expect(rolls.every(Number.isInteger)).toBe(true);
  });
});
