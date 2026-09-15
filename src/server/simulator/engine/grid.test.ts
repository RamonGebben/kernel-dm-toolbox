import { describe, expect, it } from 'vitest';
import {
  autoPlacePositions,
  chebyshevDistanceFeet,
  stepAway,
  stepToward,
} from '~/server/simulator/engine/grid';

describe('chebyshevDistanceFeet', () => {
  it('treats a diagonal move as costing the same as an orthogonal one', () => {
    expect(chebyshevDistanceFeet({ x: 0, y: 0 }, { x: 3, y: 3 })).toBe(15);
    expect(chebyshevDistanceFeet({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(15);
  });

  it('is zero for the same cell', () => {
    expect(chebyshevDistanceFeet({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(0);
  });
});

describe('autoPlacePositions', () => {
  it('places the party along the left edge', () => {
    const positions = autoPlacePositions(3, 'party');
    for (const position of positions) {
      expect(position.x).toBe(0);
    }
  });

  it('places monsters along the right edge', () => {
    const positions = autoPlacePositions(3, 'monsters', 14, 10);
    for (const position of positions) {
      expect(position.x).toBe(13);
    }
  });

  it('returns one position per combatant with no duplicates', () => {
    const positions = autoPlacePositions(5, 'party');
    expect(positions).toHaveLength(5);
    const keys = new Set(positions.map(p => `${p.x},${p.y}`));
    expect(keys.size).toBe(5);
  });
});

describe('stepToward', () => {
  it('moves diagonally toward the target when both axes differ', () => {
    expect(stepToward({ x: 0, y: 0 }, { x: 5, y: 5 }, 2)).toEqual({
      x: 2,
      y: 2,
    });
  });

  it('does not overshoot the target', () => {
    expect(stepToward({ x: 0, y: 0 }, { x: 1, y: 0 }, 5)).toEqual({
      x: 1,
      y: 0,
    });
  });

  it('is a no-op when already at the target', () => {
    expect(stepToward({ x: 4, y: 4 }, { x: 4, y: 4 }, 3)).toEqual({
      x: 4,
      y: 4,
    });
  });
});

describe('stepAway', () => {
  it('moves diagonally away from the threat', () => {
    expect(stepAway({ x: 5, y: 5 }, { x: 4, y: 4 }, 2)).toEqual({
      x: 7,
      y: 7,
    });
  });

  it('clamps to the grid extent instead of walking off the board', () => {
    expect(stepAway({ x: 0, y: 0 }, { x: 1, y: 1 }, 5, 14, 10)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it('picks an arbitrary direction when already sharing the threat cell', () => {
    const result = stepAway({ x: 4, y: 4 }, { x: 4, y: 4 }, 2, 14, 10);
    expect(result).toEqual({ x: 6, y: 6 });
  });
});
