import { describe, expect, it } from 'vitest';
import {
  consumeLowestSlot,
  hasAvailableSlot,
} from '~/server/simulator/engine/spellSlots';

describe('hasAvailableSlot', () => {
  it('is true when an exact-level slot remains', () => {
    expect(hasAvailableSlot({ 1: 2, 2: 0 }, 1)).toBe(true);
  });

  it('is true when only a higher-level slot remains', () => {
    expect(hasAvailableSlot({ 1: 0, 3: 1 }, 1)).toBe(true);
  });

  it('is false when every eligible level is spent', () => {
    expect(hasAvailableSlot({ 1: 0, 2: 0 }, 1)).toBe(false);
  });

  it('is false when only a lower level remains', () => {
    expect(hasAvailableSlot({ 1: 3 }, 2)).toBe(false);
  });

  it('is false for an empty pool', () => {
    expect(hasAvailableSlot({}, 1)).toBe(false);
  });
});

describe('consumeLowestSlot', () => {
  it('spends the exact level when available', () => {
    expect(consumeLowestSlot({ 1: 2, 2: 1 }, 1)).toEqual({ 1: 1, 2: 1 });
  });

  it('spends the lowest eligible level above the requirement, not the requirement itself', () => {
    expect(consumeLowestSlot({ 1: 0, 2: 1, 3: 1 }, 1)).toEqual({
      1: 0,
      2: 0,
      3: 1,
    });
  });

  it('leaves the pool untouched when nothing qualifies', () => {
    const remaining = { 1: 0, 2: 0 };
    expect(consumeLowestSlot(remaining, 1)).toEqual(remaining);
  });

  it('leaves an unrelated lower level untouched', () => {
    expect(consumeLowestSlot({ 1: 5, 3: 1 }, 3)).toEqual({ 1: 5, 3: 0 });
  });
});
