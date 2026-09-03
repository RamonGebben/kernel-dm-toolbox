import { describe, expect, it } from 'vitest';
import { abilityScoreToModifier, formatModifier } from '~/utils/formatModifier';

describe('formatModifier', () => {
  it('signs positive modifiers', () => {
    expect(formatModifier(3)).toBe('+3');
  });

  it('keeps the sign on negative modifiers', () => {
    expect(formatModifier(-2)).toBe('-2');
  });

  it('renders zero as +0 rather than -0', () => {
    expect(formatModifier(0)).toBe('+0');
    expect(formatModifier(-0)).toBe('+0');
  });

  it('truncates towards zero rather than rounding', () => {
    expect(formatModifier(2.9)).toBe('+2');
    expect(formatModifier(-2.9)).toBe('-2');
  });

  it('falls back to +0 for non-finite input', () => {
    expect(formatModifier(Number.NaN)).toBe('+0');
    expect(formatModifier(Number.POSITIVE_INFINITY)).toBe('+0');
  });
});

describe('abilityScoreToModifier', () => {
  it.each([
    [1, -5],
    [8, -1],
    [10, 0],
    [11, 0],
    [14, 2],
    [20, 5],
  ])('maps a score of %i to %i', (score, expected) => {
    expect(abilityScoreToModifier(score)).toBe(expected);
  });
});
