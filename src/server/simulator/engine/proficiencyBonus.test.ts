import { describe, expect, it } from 'vitest';
import { proficiencyBonusForLevel } from '~/server/simulator/engine/proficiencyBonus';

describe('proficiencyBonusForLevel', () => {
  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])('level %i has a +%i bonus', (level, expected) => {
    expect(proficiencyBonusForLevel(level)).toBe(expected);
  });

  it('clamps below level 1', () => {
    expect(proficiencyBonusForLevel(0)).toBe(2);
  });

  it('clamps above level 20', () => {
    expect(proficiencyBonusForLevel(25)).toBe(6);
  });
});
