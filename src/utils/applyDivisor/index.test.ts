import { describe, expect, it } from 'vitest';
import { applyDivisor } from '~/utils/applyDivisor';

describe('applyDivisor', () => {
  it('leaves the total untouched at full', () => {
    expect(applyDivisor(33, 1)).toBe(33);
  });

  it('floors when halved', () => {
    expect(applyDivisor(33, 2)).toBe(16);
  });

  it('floors when quartered', () => {
    expect(applyDivisor(33, 4)).toBe(8);
  });

  it('never drops below 1, even when the divided total would be 0', () => {
    expect(applyDivisor(3, 4)).toBe(1);
    expect(applyDivisor(0, 2)).toBe(1);
  });
});
