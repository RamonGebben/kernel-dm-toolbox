import { describe, expect, it } from 'vitest';
import { formatPercent } from '~/utils/formatPercent';

describe('formatPercent', () => {
  it('renders a fraction as a rounded whole-number percent', () => {
    expect(formatPercent(0.5)).toBe('50%');
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(1 / 3)).toBe('33%');
    expect(formatPercent(2 / 3)).toBe('67%');
  });
});
