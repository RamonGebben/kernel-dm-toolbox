import { describe, expect, it } from 'vitest';
import { applyGoldChange, formatGold } from '~/utils/applyGoldChange';

describe('applyGoldChange', () => {
  it('adds a deposit', () => {
    expect(applyGoldChange(100, 50)).toEqual({ ok: true, balance: 150 });
  });

  it('takes a withdrawal', () => {
    expect(applyGoldChange(100, -40)).toEqual({ ok: true, balance: 60 });
  });

  it('allows spending exactly everything', () => {
    expect(applyGoldChange(100, -100)).toEqual({ ok: true, balance: 0 });
  });

  it('refuses to overdraw rather than clamping to zero', () => {
    expect(applyGoldChange(100, -101)).toEqual({
      ok: false,
      reason: 'insufficient',
    });
  });

  it('refuses fractional gold', () => {
    expect(applyGoldChange(100, 2.5)).toEqual({
      ok: false,
      reason: 'not-whole',
    });
  });
});

describe('formatGold', () => {
  it('groups thousands', () => {
    expect(formatGold(12500)).toBe('12,500 gp');
  });

  it('reads an empty purse as 0 gp', () => {
    expect(formatGold(0)).toBe('0 gp');
  });
});
