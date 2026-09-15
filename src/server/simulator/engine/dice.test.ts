import { describe, expect, it } from 'vitest';
import {
  parseDiceNotation,
  parseDieSides,
  rollDice,
} from '~/server/simulator/engine/dice';
import { createRng } from '~/server/simulator/engine/rng';

describe('parseDiceNotation', () => {
  it('parses plain dice', () => {
    expect(parseDiceNotation('10d6')).toEqual({
      count: 10,
      sides: 6,
      bonus: 0,
    });
  });

  it('parses dice with a bonus', () => {
    expect(parseDiceNotation('2d8+4')).toEqual({
      count: 2,
      sides: 8,
      bonus: 4,
    });
  });

  it('tolerates whitespace around the bonus', () => {
    expect(parseDiceNotation('2d8 + 4')).toEqual({
      count: 2,
      sides: 8,
      bonus: 4,
    });
  });

  it('returns null for unparseable notation', () => {
    expect(parseDiceNotation('a lot of damage')).toBeNull();
    expect(parseDiceNotation('')).toBeNull();
  });
});

describe('parseDieSides', () => {
  it('reads sides from an Open5e-style uppercase label', () => {
    expect(parseDieSides('D6')).toBe(6);
  });

  it('reads sides from the custom-creature wizard lowercase default', () => {
    expect(parseDieSides('d8')).toBe(8);
  });

  it('returns 0 for null', () => {
    expect(parseDieSides(null)).toBe(0);
  });

  it('returns 0 for a label with no digits', () => {
    expect(parseDieSides('a big rock')).toBe(0);
  });
});

describe('rollDice', () => {
  it('stays within the possible range', () => {
    const rng = createRng(3);
    const dice = { count: 3, sides: 6, bonus: 2 };

    for (let i = 0; i < 500; i += 1) {
      const total = rollDice(rng, dice);
      expect(total).toBeGreaterThanOrEqual(3 + 2);
      expect(total).toBeLessThanOrEqual(18 + 2);
    }
  });

  it('is deterministic for a given seed', () => {
    const dice = { count: 4, sides: 8, bonus: 1 };
    expect(rollDice(createRng(5), dice)).toBe(rollDice(createRng(5), dice));
  });
});
